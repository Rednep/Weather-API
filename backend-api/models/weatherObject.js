export function Weather(
  _id,
  Device_Name,
  Precipitation_mm_h,
  Time,
  Latitude,
  Longitude,
  Temperature_C,
  Atmospheric_Pressure_kPa,
  Max_Wind_Speed_m_s,
  Solar_Radiation_W_m2,
  Vapor_Pressure_kPa,
  Humidity_percent,
  Wind_Direction_degrees
) {
  return {
    _id,
    "Device Name": Device_Name,
    "Precipitation mm/h": Precipitation_mm_h,
    Time,
    Latitude,
    Longitude,
    "Temperature (°C)": Temperature_C,
    "Atmospheric Pressure (kPa)": Atmospheric_Pressure_kPa,
    "Max Wind Speed (m/s)": Max_Wind_Speed_m_s,
    "Solar Radiation (W/m2)": Solar_Radiation_W_m2,
    "Vapor Pressure (kPa)": Vapor_Pressure_kPa,
    "Humidity (%)": Humidity_percent,
    "Wind Direction (°)": Wind_Direction_degrees,
  };
}
