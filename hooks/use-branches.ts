import { useEffect, useState } from "react"
import { getBranches } from "@/lib/services/data-service"
import type { Branch } from "@/lib/types"

/**
 * Fetches the list of branches created by the admin from Firestore.
 * Used to populate branch dropdowns across the app so that only
 * admin-defined branches can be selected by managers and employees.
 */
export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getBranches()
      .then(setBranches)
      .finally(() => setLoading(false))
  }, [])

  return { branches, loading }
}
