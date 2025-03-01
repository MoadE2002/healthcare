import * as React from 'react';
import { Theme, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const specializations = [
  'Cardiologist',
  'general',
  'Dermatologist',
  'Neurologist',
  'Pediatrician',
  'Surgeon',
  'Orthopedic',
  'Psychiatrist',
  'General Practitioner',
];

function getStyles(name: string, personName: readonly string[], theme: Theme) {
  return {
    fontWeight: personName.includes(name)
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular,
  };
}

interface SearchDoctorsProps {
  onFilterChange: (filters: {
    name?: string;
    specialization?: string[];
    priceRange?: [number, number];
  }) => void;
  initialFilters?: {
    name?: string;
    specialization?: string[];
    priceRange?: [number, number];
  };
}

export default function SearchDoctors({ 
  onFilterChange, 
  initialFilters 
}: SearchDoctorsProps) {
  const theme = useTheme();
  const [specialization, setSpecialization] = React.useState<string[]>(
    initialFilters?.specialization || []
  );
  const [priceRange, setPriceRange] = React.useState<number[]>(
    initialFilters?.priceRange || [0, 1000]
  );
  const [name, setName] = React.useState(initialFilters?.name || "");

  const handleSpecializationChange = (event: SelectChangeEvent<typeof specialization>) => {
    const { target: { value } } = event;
    const newSpecializations = typeof value === 'string' ? value.split(',') : value;
    setSpecialization(newSpecializations);
  };

  const handlePriceChange = (event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as number[]);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleSearch = () => {
    onFilterChange({
      name,
      specialization,
      priceRange: priceRange as [number, number]
    });
  };

  const handleReset = () => {
    setName('');
    setSpecialization([]);
    setPriceRange([0, 1000]);
    onFilterChange({
      name: '',
      specialization: [],
      priceRange: [0, 1000]
    });
  };

  const valuetext = (value: number) => {
    return `${value}$`;
  };

  const commonStyles = { width: '90%', marginBottom: '16px' };

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start">
      <p className='mt-11 text-2xl font-bold'>Search for a doctor</p>
      <TextField
        label="Name"
        variant="outlined"
        name="name"
        fullWidth
        margin="normal"
        value={name}
        onChange={handleNameChange}
        sx={commonStyles}  
      />

      <FormControl sx={commonStyles}>  
        <InputLabel id="specialization-select-label">Specialization</InputLabel>
        <Select
          labelId="specialization-select-label"
          id="specialization-select"
          multiple
          value={specialization}
          onChange={handleSpecializationChange}
          input={<OutlinedInput id="select-multiple-chip" label="Specialization" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} />
              ))}
            </Box>
          )}
          MenuProps={MenuProps}
        >
          {specializations.map((name) => (
            <MenuItem key={name} value={name} style={getStyles(name, specialization, theme)}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography gutterBottom>Price Range: {priceRange[0]}$ - {priceRange[1]}$</Typography>
      <Slider
        value={priceRange}
        onChange={handlePriceChange}
        valueLabelDisplay="auto"
        getAriaValueText={valuetext}
        disableSwap
        min={0}
        max={1000}
        sx={commonStyles}  
      />
      <Box display="flex" justifyContent="space-between" width="90%">
        <Button variant="contained" sx={{ width: '48%' }} onClick={handleSearch}>Search</Button>
        <Button variant="outlined" sx={{ width: '48%' }} onClick={handleReset}>Reset</Button>
      </Box>
    </Box>
  );
}