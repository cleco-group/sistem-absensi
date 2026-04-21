import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ─── Employees ────────────────────────────────────────────────────────────────
export function useEmployees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading]     = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name')
    if (!error) setEmployees(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const upsertEmployee = async (emp) => {
    const { id, created_at, ...payload } = emp
    if (id) {
      const { error } = await supabase.from('employees').update(payload).eq('id', id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('employees').insert(payload)
      if (error) throw error
    }
    await fetch()
  }

  const deleteEmployee = async (id) => {
    const { error } = await supabase.from('employees').delete().eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { employees, loading, refetch: fetch, upsertEmployee, deleteEmployee }
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export function useAttendance(dateStart, dateEnd) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!dateStart || !dateEnd) return
    setLoading(true)
    const { data, error } = await supabase
      .from('attendance')
      .select('*, employees(name, role, emp_code)')
      .gte('tanggal', dateStart)
      .lte('tanggal', dateEnd)
      .order('tanggal', { ascending: false })
    if (!error) setRecords(data || [])
    setLoading(false)
  }, [dateStart, dateEnd])

  useEffect(() => { fetch() }, [fetch])

  const upsertAttendance = async (payload) => {
    const { error } = await supabase
      .from('attendance')
      .upsert(payload, { onConflict: 'employee_id,tanggal' })
    if (error) throw error
    await fetch()
  }

  return { records, loading, refetch: fetch, upsertAttendance }
}
