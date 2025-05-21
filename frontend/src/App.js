import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home'; // ✅ Ajout de Home
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardEtudiant from './pages/DashboardEtudiant';
import DashboardResponsable from './pages/DashboardResponsable';
import EditProfilEtudiant from './pages/EditProfilEtudiant'; // adapte le chemin
import EditProfilResponsable from './pages/EditProfilresponsable'; // adapte le chemin

import DashboardAdmin from './pages/DashboardAdmin';
import MesOffresResponsable from './pages/MesOffresResponsable';
import CVtheque from './pages/CVtheque';
import PublierOffresAdmin from './pages/PublierOffresAdmin';
import OffresEtudiant from './pages/OffresEtudiant';
import MesCandidaturesEtudiant from './pages/MesCandidaturesEtudiant';
import CandidaturesResponsable from './pages/CandidaturesResponsable';
import CandidaturesAdmin from './pages/CandidaturesAdmin';
import AdminUtilisateurs from './pages/AdminUtilisateurs';
import ListeOffres from './pages/ListeOffres';
import ListeEntreprises from './pages/ListeEntreprises';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} /> {/* ✅ Route pour la page d'accueil */}
        <Route path="/login" element={<Login />} />
        <Route path="/modifier-profil" element={<EditProfilEtudiant />} />
        <Route path="/modifier-profil-responsable" element={<EditProfilResponsable />} />
        <Route path="/responsable/MesOffresResponsable" element={<MesOffresResponsable />} />
        <Route path="/CandidaturesAdmin" element={<CandidaturesAdmin />} />
        <Route path="/ListeOffres" element={<ListeOffres />} />
        <Route path="/ListeEntreprises" element={<ListeEntreprises />} />
        <Route path="/AdminUtilisateurs" element={<AdminUtilisateurs />} />
        

 


        <Route path="/register" element={<Register />} />
        <Route path="/OffresEtudiant" element={<OffresEtudiant />} />
        <Route path="/MesCandidaturesEtudiant" element={<MesCandidaturesEtudiant />} />
        <Route path="/dashboard-etudiant" element={<DashboardEtudiant />} />
        <Route path="/dashboard-responsable" element={<DashboardResponsable />} />
        <Route path="/responsable/cvtheque" element={<CVtheque />} />
        <Route path="/dashboard-admin" element={<DashboardAdmin />} />
        <Route path="/PublierOffresAdmin" element={<PublierOffresAdmin />} />
        <Route path="/CandidaturesResponsable" element={<CandidaturesResponsable />} />
      </Routes>
    </Router>
  );
}

export default App;
