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
#[command(author, version, about = "Email suppression engine (v2)")]
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
    bounce: u64,
    duplicates: u64,
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
   MAIN
========================= */

fn main() -> Result<()> {
    let args = Args::parse();

    let input = File::open(&args.input)
        .with_context(|| format!("Failed to open input {}", args.input.display()))?;
    let output = File::create(&args.output)
        .with_context(|| format!("Failed to create output {}", args.output.display()))?;

    let offer_md5 = Md5Index::open(&args.offer_md5)?;
    let global = load_plain(&args.global)?;
    let unsub = load_plain(&args.unsub)?;
    let (complaint_plain, complaint_md5) = load_mixed_list(&args.complaint)?;
    let bounce = load_plain(&args.bounce)?;

    let mut stats = Stats::default();
    let mut seen = HashSet::new();

    let mut writer = BufWriter::new(output);

    for line in BufReader::new(input).lines() {
        let raw_line = line?;
        stats.input += 1;

        let email = match extract_email(&raw_line) {
            Some(e) => e,
            None => {
                stats.invalid += 1;
                continue;
            }
        };

        let h = md5_hex(&email);
        if offer_md5.contains(&h) {
            stats.offer_md5 += 1;
            continue;
        }
        if global.contains(&email) {
            stats.global += 1;
            continue;
        }
        if unsub.contains(&email) {
            stats.unsubscribe += 1;
            continue;
        }
        if complaint_plain.contains(&email) || complaint_md5.contains(&h) {
            stats.complaint += 1;
            continue;
        }
        if bounce.contains(&email) {
            stats.bounce += 1;
            continue;
        }

        if seen.insert(email) {
            writeln!(writer, "{}", raw_line)?;
            stats.kept += 1;
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
