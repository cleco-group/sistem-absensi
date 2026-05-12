import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ─── Outlets ──────────────────────────────────────────────────────────────────
export function useOutlets() {
  const [outlets, setOutlets] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('outlets')
      .select('*')
      .order('name')
    if (!error) setOutlets(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const upsertOutlet = async (outlet) => {
    const { id, created_at, ...payload } = outlet
    if (id) {
      const { error } = await supabase.from('outlets').update(payload).eq('id', id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('outlets').insert(payload)
      if (error) throw error
    }
    await fetch()
  }

  const deleteOutlet = async (id) => {
    const { error } = await supabase.from('outlets').delete().eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { outlets, loading, refetch: fetch, upsertOutlet, deleteOutlet }
}

// ─── Employees ────────────────────────────────────────────────────────────────
export function useEmployees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading]     = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('employees')
      .select('*, outlets(name, lat, lng, radius)')
      .order('name')
    if (!error) setEmployees(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const upsertEmployee = async (emp) => {
    const { id, created_at, outlets, ...payload } = emp
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
      .select('*, employees(name, role, emp_code, outlet_id, outlets(name, lat, lng, radius))')
      .gte('tanggal', dateStart)
      .lte('tanggal', dateEnd)
      .order('tanggal', { ascending: false })
    if (!error) setRecords(data || [])
    setLoading(false)
  }, [dateStart, dateEnd])

  useEffect(() => { fetch() }, [fetch])

  const uploadPhoto = async (base64, fileName) => {
    try {
      // Fix for "reading blob" error: Use a more robust base64 to blob conversion
      const parts = base64.split(';base64,')
      const contentType = parts[0].split(':')[1]
      const raw = window.atob(parts[1])
      const rawLength = raw.length
      const uInt8Array = new Uint8Array(rawLength)
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i)
      }
      const blob = new Blob([uInt8Array], { type: contentType })
      
      const filePath = `attendance/${Date.now()}-${fileName}.jpg`
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(filePath, blob)
      
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath)
        
      return publicUrl
    } catch (err) {
      console.error('Upload error:', err)
      throw new Error('Gagal mengunggah foto: ' + err.message)
    }
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

  const updateAttendance = async (id, payload) => {
    const { error } = await supabase
      .from('attendance')
      .update(payload)
      .eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { records, loading, refetch: fetch, upsertAttendance, updateAttendance }
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

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export function useAuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error) setLogs(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const addLog = async (log) => {
    const { error } = await supabase.from('audit_logs').insert(log)
    if (error) throw error
    await fetch()
  }

  return { logs, loading, refetch: fetch, addLog }
}
