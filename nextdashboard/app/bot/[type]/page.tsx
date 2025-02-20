import { API_ROOT } from "@/app/env"
import axios from "axios"

export default async function Page({ params }: { params: Promise<{ type: string }> }) {
  const cronType = (await params).type
  if (cronType.startsWith('cron')) {
    const r = await axios.get(`${API_ROOT}/bot/${cronType}`)
    return (
      <div>
        <p>{r.data}</p>
      </div>
    )
  } else {
    return (<></>)
  }
}

