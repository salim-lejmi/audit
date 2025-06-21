import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Pagination, Form, Button } from 'react-bootstrap';
import '../../styles/HistoryPage.css';

const HistoryPage = () => {
    const [historyItems, setHistoryItems] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        userId: '',
        actionType: '',
        startDate: '',
        endDate: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, [filters, currentPage]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/history', {
                params: {
                    ...filters,
                    page: currentPage,
                    pageSize: 10
                }
            });
            setHistoryItems(response.data.items);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Failed to fetch history', error);
            alert('An error occurred while fetching history data.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); // Reset to first page on filter change
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="history-page container mt-4">
            <h2 className="mb-4">Activity History</h2>

            {/* Filters */}
            <Form className="history-filters mb-4">
                <div className="row">
                    <div className="col-md-3">
                        <Form.Group controlId="userId">
                            <Form.Label>User ID</Form.Label>
                            <Form.Control
                                type="number"
                                name="userId"
                                value={filters.userId}
                                onChange={handleFilterChange}
                                placeholder="Enter User ID"
                            />
                        </Form.Group>
                    </div>
                    <div className="col-md-3">
                        <Form.Group controlId="actionType">
                            <Form.Label>Action Type</Form.Label>
                            <Form.Control
                                as="select"
                                name="actionType"
                                value={filters.actionType}
                                onChange={handleFilterChange}
                            >
                                <option value="">All</option>
                                <option value="Evaluation">Evaluation</option>
                                <option value="Action">Action</option>
                            </Form.Control>
                        </Form.Group>
                    </div>
                    <div className="col-md-3">
                        <Form.Group controlId="startDate">
                            <Form.Label>Start Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="startDate"    
                                value={filters.startDate}
                                onChange={handleFilterChange}
                            />
                        </Form.Group>
                    </div>
                    <div className="col-md-3">
                        <Form.Group controlId="endDate">
                            <Form.Label>End Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                            />
                        </Form.Group>
                    </div>
                </div>
                <Button variant="primary" onClick={fetchHistory} className="mt-3">
                    Apply Filters
                </Button>
            </Form>

            {/* History Table */}
            {loading ? (
                <div className="text-center">Loading...</div>
            ) : historyItems.length === 0 ? (
                <div className="text-center">No history items found.</div>
            ) : (
                <Table striped bordered hover responsive className="history-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Action Type</th>
                            <th>Description</th>
                            <th>Timestamp</th>
                            <th>Performed By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historyItems.map(item => (
                            <tr key={item.id}>
                                <td>{item.id}</td>
                                <td>{item.actionType}</td>
                                <td>{item.description}</td>
                                <td>{new Date(item.timestamp).toLocaleString()}</td>
                                <td>{item.performedBy}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination className="justify-content-center mt-4">
                    {[...Array(totalPages).keys()].map(page => (
                        <Pagination.Item
                            key={page + 1}
                            active={page + 1 === currentPage}
                            onClick={() => handlePageChange(page + 1)}
                        >
                            {page + 1}
                        </Pagination.Item>
                    ))}
                </Pagination>
            )}
        </div>
    );
};

export default HistoryPage;