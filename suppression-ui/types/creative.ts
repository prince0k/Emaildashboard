export interface Creative {
  _id: string;
  name: string;
  html: string;                // ✅ add this
  status: "active" | "paused";
}