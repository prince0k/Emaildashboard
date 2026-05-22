"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/authContext";

export default function SegmentTable() {

    type Segment = {
    name:string
    file:string
    count:number
    size:number
    created:string
    download:string
  }

  const { hasPermission } = useAuth();
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
          className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-secondary hover:bg-hover hover:text-foreground transition-colors cursor-pointer"
        >
          Reload
        </button>

      </div>

      <table className="w-full border border-border text-sm">

        <thead>

          <tr className="bg-panel text-text-secondary">

            <th className="p-3 text-left font-medium border-b border-border">
              Segment
            </th>

            <th className="p-3 text-left font-medium border-b border-border">
              Count
            </th>

            <th className="p-3 text-left font-medium border-b border-border">
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {loading && (
            <tr>
              <td colSpan={3} className="p-4 text-text-muted">
                Loading segments...
              </td>
            </tr>
          )}

          {!loading && segments.length === 0 && (
            <tr>
              <td colSpan={3} className="p-4 text-text-muted">
                No segments found
              </td>
            </tr>
          )}

              {!loading && segments.map((seg)=>(
            <tr key={seg.file} className="border-t border-border hover:bg-hover/30 transition-colors">

              <td className="p-3 text-text-secondary border-b border-border">
                {seg.name}
              </td>

              <td className="p-3 text-text-secondary border-b border-border">
                {seg.count.toLocaleString()}
              </td>

              <td className="p-3 space-x-2 border-b border-border">
                {hasPermission("campaign.delete") ? (
                  <button
                    disabled={deleting === seg.file}
                    onClick={()=>remove(seg.file)}
                    className="text-rose hover:underline font-medium cursor-pointer"
                  >
                    {deleting === seg.file ? "Deleting..." : "Delete"}
                  </button>
                ) : (
                  <span className="text-xs text-text-muted italic">No access</span>
                )}
              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>

  );

}