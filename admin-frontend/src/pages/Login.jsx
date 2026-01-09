import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, TextField, Typography, Container, Paper } from '@mui/material'
import api from '../api/axios'

export default function Login(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try{
      const res = await api.post('/auth/login', { username, password })
      const token = res.data.token
      localStorage.setItem('token', token)
      setError(null)
      navigate('/')
    }catch(err){
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <Container maxWidth="xs" sx={{mt:8}}>
      <Paper sx={{p:3}}>
        <Typography variant="h6" component="h1" gutterBottom>Admin Login</Typography>
        <Box component="form" onSubmit={submit}>
          <TextField label="Username" fullWidth margin="normal" value={username} onChange={e=>setUsername(e.target.value)} />
          <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <Typography color="error">{error}</Typography>}
          <Button type="submit" variant="contained" fullWidth sx={{mt:2}}>Login</Button>
        </Box>
      </Paper>
    </Container>
  )
}
