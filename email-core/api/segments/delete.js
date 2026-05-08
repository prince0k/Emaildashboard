import fs from "fs";
import path from "path";

const SEGMENT_DIR = "/var/www/email-core-data/segments";

export default function remove(req,res){

 try{

  const name = req.params.name;

  if(!name){
    return res.status(400).json({
      error:"segment_name_required"
    });
  }

  const file = path.join(
    SEGMENT_DIR,
    name.endsWith(".txt") ? name : `${name}.txt`
  );

  if(!fs.existsSync(file)){
    return res.status(404).json({
      error:"segment_not_found"
    });
  }

  fs.unlinkSync(file);

  res.json({success:true});

 }catch(err){

  console.error("DELETE ERROR:",err);

  res.status(500).json({
    error:"segment_delete_failed"
  });

 }

}