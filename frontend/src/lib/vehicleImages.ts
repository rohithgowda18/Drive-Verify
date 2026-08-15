/**
 * Helper to get a high-quality vehicle image URL based on vehicle make, model, or type,
 * falling back to curated Unsplash automotive photos.
 */
export const getVehicleImageUrl = (vehicleInfo?: {
  imageUrl?: string;
  make?: string;
  model?: string;
  type?: string;
}): string => {
  if (vehicleInfo?.imageUrl && vehicleInfo.imageUrl.trim()) {
    return vehicleInfo.imageUrl.trim();
  }

  const make = (vehicleInfo?.make || "").toLowerCase();
  const model = (vehicleInfo?.model || "").toLowerCase();
  const type = (vehicleInfo?.type || "").toLowerCase();

  // Motorcycles / 2-wheelers
  if (type.includes("bike") || type.includes("scooter") || type.includes("two") || make.includes("royal") || make.includes("yamaha") || make.includes("honda bike") || make.includes("ktm") || make.includes("tvs")) {
    return "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80";
  }

  // SUVs / Trucks
  if (type.includes("suv") || model.includes("fortuner") || model.includes("thar") || model.includes("scorpio") || model.includes("creta") || model.includes("nexon") || model.includes("xuv")) {
    return "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80";
  }

  // Luxury / Sports
  if (make.includes("bmw") || make.includes("mercedes") || make.includes("audi") || make.includes("porsche") || make.includes("tesla")) {
    return "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80";
  }

  // General Sedans / Hatchbacks (Toyota, Hyundai, Honda, Suzuki, Tata)
  if (make.includes("toyota") || model.includes("camry") || model.includes("corolla")) {
    return "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80";
  }

  if (make.includes("honda") || model.includes("city") || model.includes("civic")) {
    return "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80";
  }

  if (make.includes("hyundai") || make.includes("suzuki") || make.includes("maruti")) {
    return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80";
  }

  // Default sleek automotive photo
  return "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80";
};
