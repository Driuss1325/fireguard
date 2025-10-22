import { useState } from 'react';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import AppTopbar from '../components/AppTopbar';
import AppDrawer from '../components/AppDrawer';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout(){
  const [open, setOpen] = useState(false);
  return (
    <div style={{height:'100%', display:'grid', gridTemplateRows:'64px 1fr'}}>
      <AppTopbar onMenu={()=>setOpen(true)} />
      <AppDrawer open={open} onClose={()=>setOpen(false)} />
      <Container maxWidth="xl" sx={{ my: 2 }}>
        <Grid container spacing={2}>
          <Grid xs={12}>
            <Outlet />
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}
