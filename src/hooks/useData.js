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

  const uploadPhoto = async (base64, fileName) => {
    // Convert base64 to blob
    const res = await fetch(base64)
    const blob = await res.blob()
    
    const filePath = `attendance/${Date.now()}-${fileName}.jpg`
    const { data, error } = await supabase.storage
      .from('photos')
      .upload(filePath, blob)
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath)
      
    return publicUrl
  }

  const upsertAttendance = async (payload, photoBase64) => {
    let finalPayload = { ...payload }
    
    if (photoBase64) {
      const fileName = `${payload.employee_id}-${payload.tanggal}`
      const photoUrl = await uploadPhoto(photoBase64, fileName)
      if (payload.jam_pulang) {
        finalPayload.foto_pulang = photoUrl
      } else {
        finalPayload.foto_masuk = photoUrl
      }
    }

    const { error } = await supabase
      .from('attendance')
      .upsert(finalPayload, { onConflict: 'employee_id,tanggal' })
    if (error) throw error
    await fetch()
  }

  return { records, loading, refetch: fetch, upsertAttendance }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'global')
      .single()
    if (!error) setSettings(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const updateSettings = async (payload) => {
    const { error } = await supabase
      .from('settings')
      .update(payload)
      .eq('id', 'global')
    if (error) throw error
    await fetch()
  }

  return { settings, loading, refetch: fetch, updateSettings }
}
