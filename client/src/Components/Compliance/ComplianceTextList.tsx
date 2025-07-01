import React, { useState, useEffect } from 'react';
import '../../styles/compliance.css';

import { 
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Typography, TextField, MenuItem, Button, 
  TablePagination, CircularProgress, Grid
} from '@mui/material';
import axios from 'axios';
import { 
  TextListItem, Domain, Theme, SubTheme, FilterState, RequirementStatus 
} from '../shared/types';

interface ComplianceTextListProps {
  onSelectText: (text: TextListItem) => void;
}

const ComplianceTextList: React.FC<ComplianceTextListProps> = ({ onSelectText }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [texts, setTexts] = useState<TextListItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  
  // Filter states
  const [domains, setDomains] = useState<Domain[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [subThemes, setSubThemes] = useState<SubTheme[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    domainId: '',
    themeId: '',
    subThemeId: '',
    nature: '',
    publicationYear: '',
    keyword: ''
  });

  useEffect(() => {
    // Load domains for filters
    const fetchDomains = async () => {
      try {
        const response = await axios.get<Domain[]>('/api/taxonomy/domains');
        setDomains(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des domaines:', error);
      }
    };
    
    fetchDomains();
    fetchTexts();
  }, []);

  // Fetch texts based on current filters and pagination
  const fetchTexts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, String(value));
      });
      
      // Add pagination
      queryParams.append('page', String(page + 1));
      queryParams.append('pageSize', String(rowsPerPage));
      
      console.log("URL de la requête API:", `/api/compliance/texts?${queryParams.toString()}`);
      
      const response = await axios.get<{
        texts: TextListItem[],
        totalCount: number,
        totalPages: number,
        currentPage: number
      }>(`/api/compliance/texts?${queryParams.toString()}`);
      
      console.log("Réponse de l'API:", response.data);
  
      setTexts(response.data.texts || []);
      setTotalCount(response.data.totalCount || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération des textes:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Données de l\'erreur:', error.response.data);
        console.error('Statut de l\'erreur:', error.response.status);
        console.error('En-têtes de l\'erreur:', error.response.headers);
      }
      // Set empty arrays as a fallback
      setTexts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };
  // Load themes when domain changes
  useEffect(() => {
    if (filters.domainId) {
      const fetchThemes = async () => {
        try {
          const response = await axios.get<Theme[]>(`/api/taxonomy/themes?domainId=${filters.domainId}`);
          setThemes(response.data);
          // Reset theme and subtheme selections
          setFilters(prev => ({ ...prev, themeId: '', subThemeId: '' }));
          setSubThemes([]);
        } catch (error) {
          console.error('Erreur lors de la récupération des thèmes:', error);
        }
      };
      
      fetchThemes();
    } else {
      setThemes([]);
      setSubThemes([]);
      setFilters(prev => ({ ...prev, themeId: '', subThemeId: '' }));
    }
  }, [filters.domainId]);

  // Load subthemes when theme changes
  useEffect(() => {
    if (filters.themeId) {
      const fetchSubThemes = async () => {
        try {
          const response = await axios.get<SubTheme[]>(`/api/taxonomy/subthemes?themeId=${filters.themeId}`);
          setSubThemes(response.data);
          // Reset subtheme selection
          setFilters(prev => ({ ...prev, subThemeId: '' }));
        } catch (error) {
          console.error('Erreur lors de la récupération des sous-thèmes:', error);
        }
      };
      
      fetchSubThemes();
    } else {
      setSubThemes([]);
      setFilters(prev => ({ ...prev, subThemeId: '' }));
    }
  }, [filters.themeId]);

  // Re-fetch texts when filters or pagination changes
  useEffect(() => {
    fetchTexts();
  }, [page, rowsPerPage]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0); // Reset to first page when filter changes
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = () => {
    fetchTexts();
  };

  const clearFilters = () => {
    setFilters({
      domainId: '',
      themeId: '',
      subThemeId: '',
      nature: '',
      publicationYear: '',
      keyword: ''
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'applicable':
        return 'green';
      case 'non-applicable':
        return 'red';
      case 'à vérifier':
        return 'orange';
      case 'pour information':
        return 'blue';
      default:
        return 'inherit';
    }
  };

  // Function to get the counts of each status
  const getStatusCounts = (text: TextListItem): Record<string, number> => {
    const statusMap: Record<string, number> = {
      'applicable': 0,
      'non-applicable': 0,
      'à vérifier': 0,
      'pour information': 0
    };
    
    if (text.requirementsStatuses) {
      text.requirementsStatuses.forEach((s: RequirementStatus) => {
        if (statusMap[s.status.toLowerCase()] !== undefined) {
          statusMap[s.status.toLowerCase()] = s.count;
        }
      });
    }
    
    return statusMap;
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtres
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Domaine"
              name="domainId"
              value={filters.domainId}
              onChange={handleFilterChange}
              margin="normal"
            >
              <MenuItem value="">Tous</MenuItem>
              {domains.map((domain) => (
                <MenuItem key={domain.domainId} value={domain.domainId}>
                  {domain.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Thème"
              name="themeId"
              value={filters.themeId}
              onChange={handleFilterChange}
              margin="normal"
              disabled={!filters.domainId}
            >
              <MenuItem value="">Tous</MenuItem>
              {themes.map((theme) => (
                <MenuItem key={theme.themeId} value={theme.themeId}>
                  {theme.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Sous-thème"
              name="subThemeId"
              value={filters.subThemeId}
              onChange={handleFilterChange}
              margin="normal"
              disabled={!filters.themeId}
            >
              <MenuItem value="">Tous</MenuItem>
              {subThemes.map((subTheme) => (
                <MenuItem key={subTheme.subThemeId} value={subTheme.subThemeId}>
                  {subTheme.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Nature"
              name="nature"
              value={filters.nature}
              onChange={handleFilterChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Année de Publication"
              name="publicationYear"
              type="number"
              value={filters.publicationYear}
              onChange={handleFilterChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Mot-clé"
              name="keyword"
              value={filters.keyword}
              onChange={handleFilterChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} display="flex" justifyContent="flex-end">
            <Button variant="outlined" onClick={clearFilters} sx={{ mr: 1 }}>
              Réinitialiser
            </Button>
            <Button variant="contained" onClick={handleSearch}>
              Rechercher
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Thème</TableCell>
                  <TableCell>Sous-thème</TableCell>
                  <TableCell>Référence</TableCell>
                  <TableCell>P/I</TableCell>
                  <TableCell>Statut des Exigences</TableCell>
                  <TableCell>% Applicable</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {texts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Aucun texte trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  texts.map((text) => {
                    const statusCounts = getStatusCounts(text);
                    
                    return (
                      <TableRow key={text.textId} hover>
                        <TableCell>{text.theme || '-'}</TableCell>
                        <TableCell>{text.subTheme || '-'}</TableCell>
                        <TableCell>{text.reference}</TableCell>
                        <TableCell>{text.penaltyOrIncentive || '-'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {Object.entries(statusCounts).map(([status, count]) => (
                              count > 0 && (
                                <Box 
                                  key={status}
                                  sx={{ 
                                    bgcolor: getStatusColor(status) + '1A', 
                                    color: getStatusColor(status),
                                    px: 1, 
                                    py: 0.5, 
                                    borderRadius: 1,
                                    fontSize: '0.8rem',
                                    border: `1px solid ${getStatusColor(status)}`
                                  }}
                                >
                                  {status}: {count}
                                </Box>
                              )
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>{text.applicablePercentage}%</TableCell>
                        <TableCell>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => onSelectText(text)}
                          >
                            Évaluer
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Lignes par page :"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
          />
        </>
      )}
    </Box>
  );
};

export default ComplianceTextList;