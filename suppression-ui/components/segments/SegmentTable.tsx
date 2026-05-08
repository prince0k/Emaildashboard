"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function SegmentTable() {

    type Segment = {
    name:string
    file:string
    count:number
    size:number
    created:string
    download:string
  }

  const [segments,setSegments] = useState<Segment[]>([]);
  const [loading,setLoading] = useState(false);
  const [deleting,setDeleting] = useState<string | null>(null);
  async function load(){

    try{
      setLoading(true);

      const res = await api.get("/segments/list");

      setSegments(res.data || []);

    }catch(err){

      console.error("SEGMENT LOAD ERROR",err);

    }finally{
      setLoading(false);
    }

  }

  async function remove(file:string){

    const confirmDelete = confirm(`Delete segment ${file}?`);
    if(!confirmDelete) return;

    try{

      setDeleting(file);

      await api.delete(`/segments/remove/${file}`);

      setSegments(prev => prev.filter(s => s.file !== file));

    }catch(err){

      alert("Delete failed");

    }finally{
      setDeleting(null);
    }

  }

  useEffect(()=>{
    load();
  },[]);

  return(

    <div className="space-y-4">

      <div className="flex items-center justify-between">

        <h2 className="text-lg font-semibold">
          Segments
        </h2>

        <button
          onClick={load}
          className="px-3 py-1 border rounded"
        >
          Reload
        </button>

      </div>

      <table className="w-full border">

        <thead>

          <tr className="bg-gray-100">

            <th className="p-2 text-left">
              Segment
            </th>

            <th className="p-2 text-left">
              Count
            </th>

            <th className="p-2 text-left">
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {loading && (
            <tr>
              <td colSpan={3} className="p-4">
                Loading segments...
              </td>
            </tr>
          )}

          {!loading && segments.length === 0 && (
            <tr>
              <td colSpan={3} className="p-4">
                No segments found
              </td>
            </tr>
          )}

          {!loading && segments.map((seg)=>(
            <tr key={seg.file} className="border-t">

              <td className="p-2">
                {seg.name}
              </td>

              <td className="p-2">
                {seg.count.toLocaleString()}
              </td>

              <td className="p-2 space-x-2">

                <button
                  disabled={deleting === seg.file}
                  onClick={()=>remove(seg.file)}
                  className="text-red-600"
                >
                  {deleting === seg.file ? "Deleting..." : "Delete"}
                </button>

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>

  );

}