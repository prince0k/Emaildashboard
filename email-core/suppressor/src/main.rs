use std::{
    collections::HashSet,
    fs::File,
    io::{BufRead, BufReader, BufWriter, Write},
    path::PathBuf,
};

use anyhow::{Context, Result};
use clap::Parser;
use memmap2::Mmap;
use serde::Serialize;

/* =========================
   CLI
========================= */

#[derive(Parser, Debug)]
#[command(author, version, about = "Email suppression engine (v3 — domain-aware)")]
struct Args {
    #[arg(long)]
    input: PathBuf,

    #[arg(long)]
    output: PathBuf,

    #[arg(long)]
    stats: PathBuf,

    #[arg(long = "offer-md5")]
    offer_md5: PathBuf,

    #[arg(long)]
    global: PathBuf,

    #[arg(long)]
    unsub: PathBuf,

    #[arg(long)]
    complaint: PathBuf,

    #[arg(long)]
    bounce: PathBuf,

    /* ===== NEW v3 ARGS ===== */

    /// Domain-level complaint file (optional)
    #[arg(long = "domain-complaint")]
    domain_complaint: Option<PathBuf>,

    /// Domain-level unsub file (optional)
    #[arg(long = "domain-unsub")]
    domain_unsub: Option<PathBuf>,

    /// Skip global + domain unsub suppression entirely
    #[arg(long = "skip-unsub")]
    skip_unsub: bool,

    /// Inclusion segment files (repeatable)
    #[arg(long = "inclusion")]
    inclusion: Vec<PathBuf>,

    /// Inclusion count limits matching each --inclusion (0 = no limit)
    #[arg(long = "inclusion-limit")]
    inclusion_limit: Vec<u64>,

    /// Exclusion segment files (repeatable)
    #[arg(long = "exclusion")]
    exclusion: Vec<PathBuf>,

    /// Exclusion count limits matching each --exclusion (0 = no limit)
    #[arg(long = "exclusion-limit")]
    exclusion_limit: Vec<u64>,
}

/* =========================
   STATS
========================= */

#[derive(Default, Serialize)]
struct Stats {
    input: u64,
    invalid: u64,
    offer_md5: u64,
    global: u64,
    unsubscribe: u64,
    complaint: u64,
    domain_complaint: u64,
    domain_unsub: u64,
    bounce: u64,
    duplicates: u64,
    exclusion_removed: u64,
    inclusion_added: u64,
    kept: u64,
}

/* =========================
   NORMALIZATION
========================= */

fn normalize_email(raw: &str) -> Option<String> {
    let e = raw.trim().to_ascii_lowercase();
    let at = e.find('@')?;
    if at == 0 || at + 1 >= e.len() || !e[at + 1..].contains('.') {
        return None;
    }
    Some(e)
}

/* =========================
   EXTRACT EMAIL FROM ROW
========================= */

fn extract_email(line: &str) -> Option<String> {
    let email_raw = if line.contains('|') {
        line.split('|').nth(1)?
    } else {
        line
    };

    normalize_email(email_raw)
}

/* =========================
   MD5
========================= */

fn md5_hex(s: &str) -> String {
    format!("{:x}", md5::compute(s.as_bytes()))
}

/* =========================
   SORTED MD5 LOOKUP
========================= */

struct Md5Index {
    mmap: Mmap,
    offsets: Vec<usize>,
}

impl Md5Index {
    fn open(path: &PathBuf) -> Result<Self> {
        let file = File::open(path)
            .with_context(|| format!("Failed to open MD5 file: {}", path.display()))?;
        let mmap = unsafe { Mmap::map(&file)? };

        let mut offsets = vec![0];
        for (i, &b) in mmap.iter().enumerate() {
            if b == b'\n' && i + 1 < mmap.len() {
                offsets.push(i + 1);
            }
        }

        Ok(Self { mmap, offsets })
    }

    fn contains(&self, needle: &str) -> bool {
        if needle.len() != 32 {
            return false;
        }

        let target = needle.as_bytes();
        let mut lo = 0usize;
        let mut hi = self.offsets.len();

        while lo < hi {
            let mid = (lo + hi) / 2;
            let start = self.offsets[mid];
            let end = self.mmap[start..]
                .iter()
                .position(|&b| b == b'\n')
                .map(|p| start + p)
                .unwrap_or(self.mmap.len());

            let mut slice = &self.mmap[start..end];
            if slice.ends_with(b"\r") {
                slice = &slice[..slice.len() - 1];
            }

            match slice.cmp(target) {
                std::cmp::Ordering::Equal => return true,
                std::cmp::Ordering::Less => lo = mid + 1,
                std::cmp::Ordering::Greater => hi = mid,
            }
        }

        false
    }
}

/* =========================
   LOAD PLAIN LIST
========================= */

fn load_plain(path: &PathBuf) -> Result<HashSet<String>> {
    let file = File::open(path)
        .with_context(|| format!("Failed to open {}", path.display()))?;

    Ok(BufReader::new(file)
        .lines()
        .filter_map(|l| l.ok())
        .filter_map(|l| normalize_email(&l))
        .collect())
}

/* =========================
   LOAD PLAIN (OPTIONAL)
========================= */

fn load_plain_optional(path: &Option<PathBuf>) -> Result<HashSet<String>> {
    match path {
        Some(p) => {
            if p.exists() {
                load_plain(p)
            } else {
                Ok(HashSet::new())
            }
        }
        None => Ok(HashSet::new()),
    }
}

/* =========================
   LOAD MIXED LIST
========================= */

fn load_mixed_list(path: &PathBuf) -> Result<(HashSet<String>, HashSet<String>)> {
    let file = File::open(path)
        .with_context(|| format!("Failed to open {}", path.display()))?;

    let mut plain = HashSet::new();
    let mut md5set = HashSet::new();

    for line in BufReader::new(file).lines() {
        let l = match line {
            Ok(v) => v.trim().to_string(),
            Err(_) => continue,
        };

        if l.len() == 32 && l.chars().all(|c| c.is_ascii_hexdigit()) {
            md5set.insert(l.to_ascii_lowercase());
        } else if let Some(e) = normalize_email(&l) {
            plain.insert(e);
        }
    }

    Ok((plain, md5set))
}

/* =========================
   LOAD SEGMENT EMAILS (for inclusion/exclusion)
========================= */

fn load_segment_emails(path: &PathBuf, limit: u64) -> Result<Vec<String>> {
    let file = File::open(path)
        .with_context(|| format!("Failed to open segment {}", path.display()))?;

    let mut emails = Vec::new();
    let max = if limit == 0 { u64::MAX } else { limit };

    for line in BufReader::new(file).lines() {
        if emails.len() as u64 >= max {
            break;
        }
        let raw = match line {
            Ok(v) => v,
            Err(_) => continue,
        };
        if let Some(email) = extract_email(&raw) {
            emails.push(email);
        }
    }

    Ok(emails)
}

/* =========================
   MAIN
========================= */

fn main() -> Result<()> {
    let args = Args::parse();

    let input = File::open(&args.input)
        .with_context(|| format!("Failed to open input {}", args.input.display()))?;
    let output = File::create(&args.output)
        .with_context(|| format!("Failed to create output {}", args.output.display()))?;

    /* ===== LOAD SUPPRESSION LISTS ===== */
    let offer_md5 = Md5Index::open(&args.offer_md5)?;
    let global = load_plain(&args.global)?;

    // Global unsub + complaint
    let unsub = if args.skip_unsub {
        HashSet::new()
    } else {
        load_plain(&args.unsub)?
    };
    let (complaint_plain, complaint_md5) = load_mixed_list(&args.complaint)?;
    let bounce = load_plain(&args.bounce)?;

    // Domain-level (optional)
    let domain_complaint = load_plain_optional(&args.domain_complaint)?;
    let domain_unsub = if args.skip_unsub {
        HashSet::new()
    } else {
        load_plain_optional(&args.domain_unsub)?
    };

    /* ===== LOAD EXCLUSION SETS ===== */
    let mut exclusion_set = HashSet::new();
    let mut total_exclusion_loaded: u64 = 0;
    for (i, exc_path) in args.exclusion.iter().enumerate() {
        let limit = args.exclusion_limit.get(i).copied().unwrap_or(0);
        let emails = load_segment_emails(exc_path, limit)?;
        total_exclusion_loaded += emails.len() as u64;
        for e in emails {
            exclusion_set.insert(e);
        }
    }

    let mut stats = Stats::default();
    let mut seen = HashSet::new();

    let mut writer = BufWriter::new(output);

    struct Candidate {
        email: String,
        raw_line: String,
        is_inclusion: bool,
    }

    let mut candidates = Vec::new();

    // 1. Campaign input
    for line in BufReader::new(input).lines() {
        let raw_line = line?;
        if let Some(email) = extract_email(&raw_line) {
            candidates.push(Candidate {
                email,
                raw_line,
                is_inclusion: false,
            });
        } else {
            stats.invalid += 1;
        }
    }

    // 2. Inclusions
    for (i, inc_path) in args.inclusion.iter().enumerate() {
        let limit = args.inclusion_limit.get(i).copied().unwrap_or(0);
        let emails = load_segment_emails(inc_path, limit)?;
        for email in emails {
            candidates.push(Candidate {
                email: email.clone(),
                raw_line: email,
                is_inclusion: true,
            });
        }
    }

    /* ===== MAIN SUPPRESSION LOOP ===== */
    for candidate in candidates {
        if !candidate.is_inclusion {
            stats.input += 1;
        }

        let email = candidate.email;
        let h = md5_hex(&email);

        // 1. Offer MD5
        if offer_md5.contains(&h) {
            stats.offer_md5 += 1;
            continue;
        }

        // 2. Global
        if global.contains(&email) {
            stats.global += 1;
            continue;
        }

        // 3. Global complaint
        if complaint_plain.contains(&email) || complaint_md5.contains(&h) {
            stats.complaint += 1;
            continue;
        }

        // 4. Domain complaint
        if domain_complaint.contains(&email) {
            stats.domain_complaint += 1;
            continue;
        }

        // 5. Global unsub (skipped if --skip-unsub)
        if unsub.contains(&email) {
            stats.unsubscribe += 1;
            continue;
        }

        // 6. Domain unsub (skipped if --skip-unsub)
        if domain_unsub.contains(&email) {
            stats.domain_unsub += 1;
            continue;
        }

        // 7. Bounce
        if bounce.contains(&email) {
            stats.bounce += 1;
            continue;
        }

        // 8. Exclusion
        if exclusion_set.contains(&email) {
            stats.exclusion_removed += 1;
            continue;
        }

        // 9. Dedup
        if seen.insert(email) {
            writeln!(writer, "{}", candidate.raw_line)?;
            stats.kept += 1;
            if candidate.is_inclusion {
                stats.inclusion_added += 1;
            }
        } else {
            stats.duplicates += 1;
        }
    }

    writer.flush()?;

    let stats_file = File::create(&args.stats)
        .with_context(|| format!("Failed to write stats {}", args.stats.display()))?;
    serde_json::to_writer_pretty(stats_file, &stats)?;

    Ok(())
}
