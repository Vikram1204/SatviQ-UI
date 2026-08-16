export interface DistrictLocation {
  talukas: string[];
  villages: string[];
}

export interface LocationMaster {
  Gujarat: { [district: string]: DistrictLocation };
}

export const LOCATION_DATA: LocationMaster = {
  Gujarat: {
    Ahmedabad: { talukas: ['Ahmedabad City', 'Bavla', 'Daskroi', 'Detroj-Rampura', 'Dholera', 'Mandal', 'Sanand', 'Viramgam'], villages: ['Ahmedabad', 'Bavla', 'Dholera', 'Mandal', 'Sanand', 'Viramgam'] },
    Amreli: { talukas: ['Amreli', 'Babra', 'Bagasara', 'Dhari', 'Jafrabad', 'Khambha', 'Kunkavav-Vadia', 'Lathi', 'Lilia', 'Rajula', 'Savarkundla'], villages: ['Amreli', 'Babra', 'Bagasara', 'Dhari', 'Jafrabad', 'Khambha', 'Lathi', 'Rajula', 'Savarkundla'] },
    Anand: { talukas: ['Anand', 'Anklav', 'Borsad', 'Khambhat', 'Petlad', 'Sojitra', 'Tarapur', 'Umreth'], villages: ['Anand', 'Anklav', 'Borsad', 'Khambhat', 'Petlad', 'Sojitra', 'Tarapur', 'Umreth'] },
    Aravalli: { talukas: ['Bayad', 'Bhiloda', 'Dhansura', 'Malpur', 'Meghraj', 'Modasa'], villages: ['Bayad', 'Bhiloda', 'Dhansura', 'Malpur', 'Meghraj', 'Modasa'] },
    Banaskantha: { talukas: ['Amirgadh', 'Bhabhar', 'Danta', 'Dantiwada', 'Deesa', 'Deodar', 'Dhanera', 'Kankrej', 'Lakhani', 'Palanpur', 'Suigam', 'Tharad', 'Vadgam', 'Vav'], villages: ['Palanpur', 'Deesa', 'Danta', 'Dhanera', 'Tharad', 'Vav', 'Vadgam'] },
    Bharuch: { talukas: ['Amod', 'Ankleshwar', 'Bharuch', 'Hansot', 'Jambusar', 'Jhagadia', 'Netrang', 'Valia', 'Vagra'], villages: ['Bharuch', 'Ankleshwar', 'Amod', 'Jambusar', 'Jhagadia', 'Netrang', 'Vagra'] },
    Bhavnagar: { talukas: ['Bhavnagar', 'Gariadhar', 'Ghogha', 'Jesar', 'Mahuva', 'Palitana', 'Sihor', 'Talaja', 'Umrala', 'Vallabhipur'], villages: ['Bhavnagar', 'Gariadhar', 'Mahuva', 'Palitana', 'Sihor', 'Talaja'] },
    Botad: { talukas: ['Barwala', 'Botad', 'Gadhada', 'Ranpur'], villages: ['Botad', 'Barwala', 'Gadhada', 'Ranpur'] },
    Chhota_Udepur: { talukas: ['Bodeli', 'Chhota Udepur', 'Jetpur Pavi', 'Kavant', 'Nasvadi', 'Sankheda'], villages: ['Chhota Udepur', 'Bodeli', 'Kavant', 'Nasvadi', 'Sankheda'] },
    Dahod: { talukas: ['Dahod', 'Devgad Baria', 'Dhanpur', 'Fatepura', 'Garbada', 'Jhalod', 'Limkheda', 'Sanjeli'], villages: ['Dahod', 'Devgad Baria', 'Jhalod', 'Limkheda', 'Fatepura'] },
    Dang: { talukas: ['Ahwa', 'Subir', 'Waghai'], villages: ['Ahwa', 'Subir', 'Waghai'] },
    Devbhumi_Dwarka: { talukas: ['Bhanvad', 'Dwarka', 'Kalyanpur', 'Khambhalia'], villages: ['Dwarka', 'Bhanvad', 'Kalyanpur', 'Khambhalia'] },
    Gandhinagar: { talukas: ['Dehgam', 'Gandhinagar', 'Kalol', 'Mansa'], villages: ['Gandhinagar', 'Dehgam', 'Kalol', 'Mansa'] },
    Gir_Somnath: { talukas: ['Gir Gadhada', 'Kodinar', 'Sutrapada', 'Talala', 'Una', 'Veraval'], villages: ['Veraval', 'Una', 'Kodinar', 'Talala', 'Sutrapada'] },
    Jamnagar: { talukas: ['Dhrol', 'Jamnagar', 'Jodiya', 'Kalavad', 'Lalpur'], villages: ['Jamnagar', 'Dhrol', 'Jodiya', 'Kalavad', 'Lalpur'] },
    Junagadh: { talukas: ['Bhesan', 'Junagadh', 'Keshod', 'Malia Hatina', 'Manavadar', 'Mendarda', 'Vanthali', 'Visavadar'], villages: ['Junagadh', 'Keshod', 'Manavadar', 'Mendarda', 'Vanthali', 'Visavadar'] },
    Kheda: { talukas: ['Balasinor', 'Kapadvanj', 'Kathlal', 'Kheda', 'Mahudha', 'Matar', 'Mehmedabad', 'Nadiad', 'Thasra', 'Vaso'], villages: ['Kheda', 'Nadiad', 'Kapadvanj', 'Kathlal', 'Mahudha'] },
    Kutch: { talukas: ['Abdasa', 'Anjar', 'Bhachau', 'Bhuj', 'Gandhidham', 'Lakhpat', 'Mandvi', 'Mundra', 'Nakhatrana', 'Rapar'], villages: ['Bhuj', 'Anjar', 'Gandhidham', 'Mandvi', 'Mundra', 'Rapar'] },
    Mahisagar: { talukas: ['Balasinor', 'Kadana', 'Khanpur', 'Lunawada', 'Santrampur', 'Virpur'], villages: ['Lunawada', 'Balasinor', 'Kadana', 'Khanpur', 'Santrampur'] },
    Mehsana: { talukas: ['Becharaji', 'Jotana', 'Kadi', 'Kheralu', 'Mehsana', 'Satlasana', 'Unjha', 'Vadnagar', 'Vijapur', 'Visnagar'], villages: ['Mehsana', 'Kadi', 'Unjha', 'Vadnagar', 'Visnagar', 'Vijapur'] },
    Morbi: { talukas: ['Halvad', 'Maliya', 'Morbi', 'Tankara', 'Wankaner'], villages: ['Morbi', 'Halvad', 'Maliya', 'Tankara', 'Wankaner'] },
    Narmada: { talukas: ['Dediapada', 'Garudeshwar', 'Nandod', 'Sagbara', 'Tilakwada'], villages: ['Rajpipla', 'Dediapada', 'Garudeshwar', 'Sagbara'] },
    Navsari: { talukas: ['Chikhli', 'Gandevi', 'Jalalpore', 'Khergam', 'Navsari', 'Vansda'], villages: ['Navsari', 'Chikhli', 'Gandevi', 'Jalalpore', 'Vansda'] },
    Panchmahal: { talukas: ['Ghoghamba', 'Godhra', 'Halol', 'Jambughoda', 'Kalol', 'Morwa Hadaf', 'Shehera'], villages: ['Godhra', 'Halol', 'Kalol', 'Shehera', 'Ghoghamba'] },
    Patan: { talukas: ['Chanasma', 'Harij', 'Patan', 'Radhanpur', 'Santalpur', 'Saraswati', 'Sidhpur'], villages: ['Patan', 'Radhanpur', 'Sidhpur', 'Chanasma', 'Harij'] },
    Porbandar: { talukas: ['Kutiyana', 'Porbandar', 'Ranavav'], villages: ['Porbandar', 'Kutiyana', 'Ranavav'] },
    Rajkot: { talukas: ['Dhoraji', 'Gondal', 'Jamkandorna', 'Jasdan', 'Jetpur', 'Kotda Sangani', 'Lodhika', 'Paddhari', 'Rajkot', 'Upleta', 'Vinchiya'], villages: ['Rajkot', 'Gondal', 'Jetpur', 'Jasdan', 'Dhoraji', 'Upleta'] },
    Sabarkantha: { talukas: ['Himatnagar', 'Idar', 'Khedbrahma', 'Poshina', 'Prantij', 'Talod', 'Vadali', 'Vijaynagar'], villages: ['Himatnagar', 'Idar', 'Khedbrahma', 'Prantij', 'Talod', 'Vadali'] },
    Surat: { talukas: ['Bardoli', 'Choryasi', 'Kamrej', 'Mahuva', 'Mandvi', 'Mangrol', 'Olpad', 'Palsana', 'Umarpada'], villages: ['Surat', 'Bardoli', 'Kamrej', 'Olpad', 'Palsana', 'Mandvi'] },
    Surendranagar: { talukas: ['Chotila', 'Chuda', 'Dhrangadhra', 'Lakhtar', 'Limbdi', 'Muli', 'Patdi', 'Sayla', 'Wadhwan'], villages: ['Sayla', 'Chotila', 'Limbdi', 'Wadhwan', 'Muli', 'Dhrangadhra', 'Lakhtar'] },
    Tapi: { talukas: ['Dolvan', 'Nizar', 'Songadh', 'Uchchhal', 'Valod', 'Vyara'], villages: ['Vyara', 'Songadh', 'Valod', 'Nizar', 'Uchchhal'] },
    Vadodara: { talukas: ['Dabhoi', 'Desar', 'Karjan', 'Padra', 'Savli', 'Sinor', 'Vadodara', 'Vaghodia'], villages: ['Vadodara', 'Dabhoi', 'Padra', 'Karjan', 'Savli', 'Vaghodia'] },
    Valsad: { talukas: ['Dharampur', 'Kaprada', 'Pardi', 'Umbergaon', 'Valsad', 'Vapi'], villages: ['Valsad', 'Vapi', 'Pardi', 'Umbergaon', 'Dharampur'] }
  }
};
