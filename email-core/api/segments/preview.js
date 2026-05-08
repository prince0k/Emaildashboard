import Campaign from "../../models/Campaign.js";
import ClickLog from "../../models/ClickLog.js";
import OpenLog from "../../models/OpenLog.js";
import Offer from "../../models/Offer.js";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function shuffleArray(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default async function preview(req, res) {
  try {
    const {
    type,
    offerId,
    emailDomain,
    sendingDomain,
    vmta,
    country,
    listId,
    from,
    to,
    isp,
    shuffle,
    sort,
    openButNotClick,
    clickButNotOpen,
    minOpen,
    maxOpen,
    minClick,
    maxClick
  } = req.query;
    const minOpenValue = toNumberOrNull(minOpen);
    const maxOpenValue = toNumberOrNull(maxOpen);
    const minClickValue = toNumberOrNull(minClick);
    const maxClickValue = toNumberOrNull(maxClick);

    if (!["click", "open", "both"].includes(type)) {
      return res.status(400).json({
        error: "invalid_segment_type"
      });
    }

    /* =============================
       STEP 1: FETCH RUNTIME OFFERS (OPTIONAL)
    ============================== */

    let runtimeIds = null;

    if (offerId) {

      const campaigns = await Campaign
        .find({ offerId })
        .select("runtimeOfferId")
        .lean();

      runtimeIds = campaigns
        .map(c => c.runtimeOfferId)
        .filter(Boolean);

    }

    let offerVid = null;

    if (offerId) {

      const offer = await Offer
        .findById(offerId)
        .select("vid")
        .lean();

      if (offer) {
        offerVid = offer.vid || null;
      }

    }

    

    if (offerId && (!runtimeIds || runtimeIds.length === 0)) {
      return res.json({
        count: 0,
        sample: []
      });
    }

    /* =============================
       STEP 2: BUILD QUERY
    ============================== */

    const baseQuery = {
      email: { $exists: true, $ne: null }
    };

    if (runtimeIds && runtimeIds.length > 0) {
      baseQuery.offer_id = { $in: runtimeIds };
    }

    const clickQuery = { ...baseQuery };
    const openQuery = { ...baseQuery };

    if (from && to) {

      clickQuery.day = {
        $gte: from,
        $lte: to
      };

      openQuery.day = {
        $gte: new Date(from + "T00:00:00"),
        $lte: new Date(to + "T23:59:59")
      };

    }

    if (sendingDomain) {
      clickQuery.send_domain = sendingDomain;
      openQuery.send_domain = sendingDomain;
    }

    if (vmta) {
      clickQuery.vmta = vmta;
      openQuery.vmta = vmta;
    }

    if (country) {
      clickQuery.country = country;
      openQuery.country = country;
    }

    if (listId) {
      clickQuery.list_id = listId;
      openQuery.list_id = listId;
    }

    if (isp) {

      const regex = {
        $regex: `@${isp}\\.`,
        $options: "i"
      };

      clickQuery.$and = [
        { email: clickQuery.email },
        { email: regex }
      ];

      openQuery.$and = [
        { email: openQuery.email },
        { email: regex }
      ];

      delete clickQuery.email;
      delete openQuery.email;
    }

    /* =============================
       STEP 3: FETCH EMAILS
    ============================== */

    let emails = [];

    if (type === "click") {

      const rows = await ClickLog.aggregate([
      { $match: clickQuery },
      {
        $group: {
          _id: { $toLower: "$email" },
          list_id: { $first: "$list_id" },
          click_count: { $sum: 1 }
        }
      }
    ]).allowDiskUse(true);

    emails = rows.map(r => ({
      email: r._id,
      list_id: r.list_id || "",
      click_count: r.click_count || 0
    }));
    }

    if (type === "open") {

    const rows = await OpenLog.aggregate([
      { $match: openQuery },
      {
        $group: {
          _id: { $toLower: "$email" },
          list_id: { $first: "$list_id" },
          open_count: { $sum: "$total_open_count" }
        }
      }
    ]).allowDiskUse(true);

    emails = rows.map(r => ({
        email: r._id,
        list_id: r.list_id || "",
        open_count: r.open_count || 0
      }));
    }

    if (type === "both") {

      const clickRows = await ClickLog.aggregate([
      { $match: clickQuery },
      {
        $group: {
          _id: { $toLower: "$email" },
          list_id: { $first: "$list_id" }
        }
      }
    ]).allowDiskUse(true);

    const openRows = await OpenLog.aggregate([
      { $match: openQuery },
      {
        $group: {
          _id: { $toLower: "$email" },
          list_id: { $first: "$list_id" }
        }
      }
    ]).allowDiskUse(true);

      const clickEmails = clickRows.map(r => ({
        email: r._id,
        list_id: r.list_id || ""
      }));

      const openEmails = openRows.map(r => ({
        email: r._id,
        list_id: r.list_id || ""
      }));

      const map = new Map();

      clickEmails.forEach(e=>{
        map.set(e.email,e);
      });

      openEmails.forEach(e=>{
        if(!map.has(e.email)){
          map.set(e.email,e);
        }
      });

      emails = [...map.values()];
    }

    /* =============================
       STEP 4: EMAIL DOMAIN FILTER
    ============================== */

    if (emailDomain) {
      const domain = emailDomain.toLowerCase();

      emails = emails.filter(e =>
        e.email && e.email.toLowerCase().endsWith(`@${domain}`)
      );
    }

    /* =============================
      STEP 5: OPEN BUT NOT CLICK
    ============================= */

    if (openButNotClick === "true") {

      const clickFilter = { ...clickQuery };

      const clickRows = await ClickLog.aggregate([
        { $match: clickFilter },
        {
          $group: {
            _id: { $toLower: "$email" }
          }
        }
      ]);

      const clickSet = new Set(clickRows.map(r => r._id));

      emails = emails.filter(e => !clickSet.has(e.email));
    }


    /* =============================
      STEP 6: CLICK BUT NOT OPEN
    ============================= */

    if (clickButNotOpen === "true") {

      const openFilter = { ...openQuery };

      const openRows = await OpenLog.aggregate([
        { $match: openFilter },
        {
          $group: {
            _id: { $toLower: "$email" }
          }
        }
      ]);

      const openSet = new Set(openRows.map(r => r._id));

      emails = emails.filter(e => !openSet.has(e.email));
    }
    /* =============================
       STEP 7: NORMALIZE + DEDUPE
    ============================== */

    const emailMap = new Map();

    for (let row of emails) {

      if (!row.email) continue;

      const email = row.email.trim().toLowerCase();

      if (!EMAIL_REGEX.test(email)) continue;

      if (!emailMap.has(email)) {
        emailMap.set(email, row);
      }

    }

    const finalEmails = [...emailMap.values()];

    /* =============================
      COUNT FILTER
    ============================= */

    let filteredEmails = finalEmails.filter(row => {

      if (minOpenValue !== null && (row.open_count || 0) < minOpenValue) return false;
      if (maxOpenValue !== null && (row.open_count || 0) > maxOpenValue) return false;
      if (minClickValue !== null && (row.click_count || 0) < minClickValue) return false;
      if (maxClickValue !== null && (row.click_count || 0) > maxClickValue) return false;

      return true;

    });

    /* =============================
      SORT / SHUFFLE
    ============================= */

    if(sort === "asc"){
      filteredEmails.sort((a,b) => a.email.localeCompare(b.email));
    }

    if(sort === "desc"){
      filteredEmails.sort((a,b) => b.email.localeCompare(a.email));
    }

    if(shuffle === "true"){
      shuffleArray(filteredEmails);
    }


    function generateSegmentName({
      type,
      vid,
      isp,
      sendingDomain,
      vmta,
      from,
      to
    }){

      const parts = [];

      if(type === "click") parts.push("clicker");
      else if(type === "open") parts.push("opener");
      else parts.push("engager");

      if(vid){
        parts.push(`vid_${vid}`);
      }

      if(isp){
        parts.push(isp);
      }

      if(sendingDomain){
        parts.push(`domain_${sendingDomain}`);
      }

      if(vmta){
        parts.push(`vmta_${vmta}`);
      }

      const today = new Date().toISOString().slice(0,10);

      if(!from && !to){
        parts.push("alltime");
      }
      else if(to === today){
        const diff =
          Math.floor(
            (new Date(today) - new Date(from)) /
            (1000*60*60*24)
          ) + 1;

        parts.push(`last${diff}days`);
      }

      return parts.join("_");
    }
    /* =============================
       RESPONSE
    ============================== */

    const segmentName = generateSegmentName({
      type,
      vid: offerVid,
      isp,
      sendingDomain,
      vmta,
      from,
      to
    }) + ".txt";

    return res.json({
      count: filteredEmails.length,
      segment: segmentName,
      sample: filteredEmails.slice(0,10).map(r => 
        `warm|${r.email}|${r.list_id || ""}|||||||||`
      )
    });

  } catch (err) {
    console.error("SEGMENT PREVIEW ERROR:", err);

    return res.status(500).json({
      error: "segment_preview_failed"
    });
  }
}