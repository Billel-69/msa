import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaRedo, FaStar, FaTrophy, FaCog, FaPlay, FaBolt, FaFire, FaCrown } from 'react-icons/fa';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import './FlashCards.css';
