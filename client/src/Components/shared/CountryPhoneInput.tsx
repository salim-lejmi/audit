import React, { useState } from 'react';
import '../../styles/CountryPhoneInput.css';

interface Country {
  code: string;
  name: string;
  dial_code: string;
  flag: string;
}

interface CountryPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  className?: string;
}

const countries: Country[] = [
  { code: 'TN', name: 'Tunisia', dial_code: '+216', flag: '🇹🇳' },
  { code: 'FR', name: 'France', dial_code: '+33', flag: '🇫🇷' },
  { code: 'US', name: 'United States', dial_code: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial_code: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', dial_code: '+49', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', dial_code: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dial_code: '+34', flag: '🇪🇸' },
  { code: 'CA', name: 'Canada', dial_code: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dial_code: '+61', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', dial_code: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dial_code: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', dial_code: '+91', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', dial_code: '+55', flag: '🇧🇷' },
  { code: 'RU', name: 'Russia', dial_code: '+7', flag: '🇷🇺' },
  { code: 'SA', name: 'Saudi Arabia', dial_code: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', dial_code: '+971', flag: '🇦🇪' },
  { code: 'EG', name: 'Egypt', dial_code: '+20', flag: '🇪🇬' },
  { code: 'MA', name: 'Morocco', dial_code: '+212', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algeria', dial_code: '+213', flag: '🇩🇿' },
  { code: 'LY', name: 'Libya', dial_code: '+218', flag: '🇱🇾' }
];

const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  value,
  onChange,
  placeholder = "Numéro de téléphone",
  required = false,
  id,
  className = ""
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Initialize phone number from value prop
  React.useEffect(() => {
    if (value) {
      // Try to extract country code and phone number
      const country = countries.find(c => value.startsWith(c.dial_code));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.substring(country.dial_code.length));
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    const fullNumber = phoneNumber ? `${country.dial_code}${phoneNumber}` : '';
    onChange(fullNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value.replace(/\D/g, ''); // Only allow digits
    setPhoneNumber(number);
    const fullNumber = number ? `${selectedCountry.dial_code}${number}` : '';
    onChange(fullNumber);
  };

  return (
    <div className={`country-phone-input ${className}`}>
      <div className="country-selector" onClick={() => setIsOpen(!isOpen)}>
        <span className="flag">{selectedCountry.flag}</span>
        <span className="dial-code">{selectedCountry.dial_code}</span>
        <span className="dropdown-arrow">▼</span>
        
        {isOpen && (
          <div className="country-dropdown">
            {countries.map((country) => (
              <div
                key={country.code}
                className="country-option"
                onClick={() => handleCountrySelect(country)}
              >
                <span className="flag">{country.flag}</span>
                <span className="country-name">{country.name}</span>
                <span className="dial-code">{country.dial_code}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <input
        type="tel"
        id={id}
        className="phone-input"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
};

export default CountryPhoneInput;