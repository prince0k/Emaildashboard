"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

type Segment = {
  name:string
  file:string
};

export default function SegmentCombine(){

  const [segments,setSegments] = useState<Segment[]>([]);
  const [include,setInclude] = useState<string[]>([]);
  const [exclude,setExclude] = useState<string[]>([]);
  const [name,setName] = useState("");
  const [loading,setLoading] = useState(false);

  async function load(){

    const res = await api.get("/segments/list");

    setSegments(res.data || []);

  }

  async function combine(){

    try{

      setLoading(true);

      await api.post("/segments/combine",{
        name,
        includeSegments:include,
        excludeSegments:exclude
      });

      alert("Segment combined successfully");

    }catch(err){

      console.error(err);
      alert("Combine failed");

    }finally{
      setLoading(false);
    }

  }

  useEffect(()=>{
    load();
  },[]);

  function toggleInclude(file:string){

    setInclude((prev)=>
      prev.includes(file)
        ? prev.filter(s=>s!==file)
        : [...prev,file]
    );

  }

  function toggleExclude(file:string){

    setExclude((prev)=>
      prev.includes(file)
        ? prev.filter(s=>s!==file)
        : [...prev,file]
    );

  }

  return(

    <div className="space-y-6">

      <h2 className="text-lg font-semibold">
        Combine Segments
      </h2>

      <input
        placeholder="New Segment Name"
        value={name}
        onChange={(e)=>setName(e.target.value)}
        className="border p-2"
      />

      <div className="grid grid-cols-2 gap-6">

        <div>

          <h3 className="font-semibold mb-2">
            Include Segments
          </h3>

          {segments.map(seg=>(
            <label key={seg.file} className="block">

              <input
                type="checkbox"
                checked={include.includes(seg.file)}
                onChange={()=>toggleInclude(seg.file)}
              />

              {" "}
              {seg.name}

            </label>
          ))}

        </div>

        <div>

          <h3 className="font-semibold mb-2">
            Exclude Segments
          </h3>

          {segments.map(seg=>(
            <label key={seg.file} className="block">

              <input
                type="checkbox"
                checked={exclude.includes(seg.file)}
                onChange={()=>toggleExclude(seg.file)}
              />

              {" "}
              {seg.name}

            </label>
          ))}

        </div>

      </div>

      <button
        onClick={combine}
        disabled={!name || include.length===0 || loading}
        className="border px-4 py-2"
      >
        Combine
      </button>

    </div>

  );

}