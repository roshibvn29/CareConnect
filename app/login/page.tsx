 "use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
export default function Login() {
  const [error,setError]=useState(""); const router=useRouter();
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setError("");const f=new FormData(e.currentTarget);const r=await fetch("/api/auth/login",{method:"POST",body:JSON.stringify(Object.fromEntries(f)),headers:{"Content-Type":"application/json"}});const d=await r.json();if(!r.ok)return setError(d.error);router.push("/dashboard");}
  return <main className="mx-auto max-w-md px-6 py-16"><div className="card p-8"><h1 className="text-3xl font-bold">Welcome back</h1><form onSubmit={submit} className="mt-6 space-y-4"><input name="email" type="email" required placeholder="Email" className="w-full rounded-xl border p-3"/><input name="password" type="password" required placeholder="Password" className="w-full rounded-xl border p-3"/>{error&&<p className="text-sm text-red-600">{error}</p>}<button className="btn-primary w-full">Sign in</button></form></div></main>
}