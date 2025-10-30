/*import{saveReport} from '../services/reports';

const enviarReporte=async() => {
    try{
        await saveReport({
        categoria:categoria.value,
        descripcion: descripcion.value,
        ubicacion:ubicacion.value,
        imagen:imageFile.value?.name || '' ,
        });
         router.push("/report/confirmado");

    }catch(error){
        alert("Hubo un error al enviar el reporte");
    }
};*/


import supabase from './supabase';

/**
 * Sube una imagen al bucket y devuelve la URL publica
 * @param {File} file
 * @returns {Promise<string>} URL pública
 */

export async function uploadImage(file){
   console.log("Subiendo al bucket 'report-images' =>", file.name); 
    const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
    .from('report-images') // nombre del bucket
    .upload(fileName, file);

  if (error) {
    console.error('[uploadImage] Error al subir imagen:', error);
    throw error;
  }

  const { data: publicData } = supabase
    .storage
    .from('report-images')
    .getPublicUrl(fileName);

  return publicData.publicUrl;
}

/**
 * Guarda un nuevo reporte en la base de datos
 * @param  {{categoria: string, descripcion: string, ubicacion: string, imagen: string, estado: string, fecha: string, reclamaron: number}} data
 */

export async function saveReport(data) {
  const { error } = await supabase
    .from('reports')
    .insert({
      categoria: data.categoria,
      descripcion: data.descripcion,
      ubicacion: data.ubicacion,
      latitud:data.latitud,
      longitud: data.longitud,
      imagen: data.imagen,
      user_id: data.user_id,
      email: data.email,
    });

  if (error) {
    console.error('[saveReport] Error al guardar el reporte:', error);
    throw error;
  }
}

/**
 * Trae todos los reportes
 */
export async function fetchAllReports() {
  const { data, error } = await supabase.from('reports').select('*');
  if (error) {
    console.error('[fetchAllReports] Error al obtener reportes:', error);
    throw error;
  }
  return data;
}

/**
 * Escucha nuevos reportes en tiempo real
 * @param {Function} callback 
 */
export function subscribeToNewReports(callback) {
  return supabase
    .channel('realtime:public:reports')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'reports' },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
}