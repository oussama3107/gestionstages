export const villesNoms = [
  "Agadir", "Ahfir", "Ait Melloul", "Akhfenir", "Akka", "Al Hoceima", "Aourir", "Arfoud", "Asilah", "Assa", "Azemmour",
  "Azilal", "Azrou", "Bab Berred", "Beni Mellal", "Ben Guerir", "Benslimane", "Berkane", "Berrechid", "Biougra", "Bouarfa",
  "Boulmane", "Boulemane", "Bouznika", "Casablanca", "Chefchaouen", "Chichaoua", "Dar Bouazza", "Dakhla", "Demnate",
  "Drarga", "El Hajeb", "El Jadida", "El Kelaâ des Sraghna", "Erfoud", "Errachidia", "Essaouira", "Fès", "Fquih Ben Salah",
  "Fnideq", "Guelmim", "Guercif", "Ifrane", "Inezgane", "Jerada", "Jorf El Melha", "Kalaat Mgouna", "Kasba Tadla",
  "Kénitra", "Kelaat Sraghna", "Khémisset", "Khénifra", "Khouribga", "Ksar El Kébir", "Ksar Sghir", "Laâyoune",
  "Larache", "Martil", "Marrakech", "M'diq", "Meknès", "Midelt", "Mohammedia", "Moulay Bousselham", "Nador",
  "Ouarzazate", "Ouazzane", "Oued Zem", "Oujda", "Rabat", "Safi", "Salé", "Sefrou", "Sidi Bennour", "Sidi Ifni",
  "Sidi Kacem", "Sidi Slimane", "Skhirat", "Souk Sebt", "Tahla", "Taliouine", "Tamegroute", "Tan-Tan", "Tanger",
  "Taounate", "Taourirt", "Taroudant", "Taza", "Témara", "Tendrara", "Tiflet", "Tinghir", "Tiznit", "Tétouan",
  "Youssoufia", "Zagora"
];

const generateId = (name) => {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/'/g, '').replace(/â/g, 'a').replace(/é/g, 'e').replace(/è/g, 'e').replace(/ç/g, 'c');
};

export const villesMaroc = villesNoms.map(nom => ({
  id: generateId(nom),
  nom: nom
})).sort((a, b) => a.nom.localeCompare(b.nom));

// Optionnel: Vérification des ID dupliqués en développement
const ids = villesMaroc.map(v => v.id);
const duplicateIds = ids.filter((item, index) => ids.indexOf(item) !== index);
if (duplicateIds.length > 0) {
  console.warn("Attention: IDs de villes dupliqués détectés après génération !", duplicateIds);
}