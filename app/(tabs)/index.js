import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
  TextInput, // Importante para la barra de búsqueda
  TouchableOpacity, // Importante para los botones
  Keyboard
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

// 🔑 TU API KEY
const API_KEY = 'b82d29a256abd95b0a06d27d33955eb1'; 

const { width, height } = Dimensions.get('window');

export default function WeatherScreen() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // NUEVO: Estado para guardar lo que escribes en la búsqueda
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadCurrentLocationWeather();
  }, []);

  const loadCurrentLocationWeather = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Se necesita permiso de ubicación para ver el clima local.');
        setLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      await fetchWeather(`lat=${location.coords.latitude}&lon=${location.coords.longitude}`);
    } catch (error) {
      console.error(error);
      setErrorMsg('Error al obtener tu ubicación.');
      setLoading(false);
    }
  };

  // NUEVO: Función para buscar ciudad
  const searchCity = async () => {
    if (searchText.trim() === '') return;
    Keyboard.dismiss(); // Ocultar teclado
    setLoading(true);
    setErrorMsg(null);
    // Buscamos por nombre de ciudad (q=nombre)
    await fetchWeather(`q=${searchText}`);
    setSearchText(''); // Limpiar barra
  };

  const fetchWeather = async (query) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?${query}&units=metric&appid=${API_KEY}&lang=es`
      );
      setWeatherData(response.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setErrorMsg('No encontramos esa ciudad. Intenta de nuevo.');
      setLoading(false);
    }
  };

  // Lógica del Asistente y Diseño Minimalista
  const getWeatherTheme = (weatherMain) => {
    switch (weatherMain) {
      case 'Clear':
        return {
          colors: ['#4da0b0', '#d39d38'],
          icon: 'weather-sunny',
          message: 'Cielo despejado.',
          recommendation: '☀️ Excelente día para lavar ropa o salir a correr.'
        };
      case 'Clouds':
        return {
          colors: ['#D7D2CC', '#304352'],
          icon: 'weather-cloudy',
          message: 'Está nublado.',
          recommendation: '🌥️ Buen clima para trabajar concentrado o leer un libro.'
        };
      case 'Rain':
      case 'Drizzle':
        return {
          colors: ['#005C97', '#363795'],
          icon: 'weather-rainy',
          message: 'Lluvia ligera.',
          recommendation: '☔ No olvides el paraguas. ¿Quizás una tarde de películas?'
        };
      case 'Thunderstorm':
        return {
          colors: ['#232526', '#414345'],
          icon: 'weather-lightning',
          message: 'Tormenta eléctrica.',
          recommendation: '⛈️ Desconecta equipos sensibles y quédate en casa seguro.'
        };
      case 'Snow':
        return {
          colors: ['#83a4d4', '#b6fbff'],
          icon: 'weather-snowy',
          message: 'Nieve.',
          recommendation: '☃️ ¡Abrígate mucho! Perfecto para un chocolate caliente.'
        };
      default:
        return {
          colors: ['#3a7bd5', '#3a6073'],
          icon: 'weather-partly-cloudy',
          message: 'Clima tranquilo.',
          recommendation: '😊 Disfruta tu día y haz algo que te guste.'
        };
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0000ff" /><Text style={{marginTop:10}}>Consultando el cielo...</Text></View>;
  }

  if (errorMsg) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={50} color="red" />
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity onPress={loadCurrentLocationWeather} style={styles.retryButton}>
          <Text style={styles.retryText}>Volver a mi ubicación</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const theme = getWeatherTheme(weatherData.weather[0].main);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={theme.colors} style={styles.background} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* NUEVO: Barra de Búsqueda Transparente */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ciudad (ej. París)"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={searchCity}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={searchCity}>
            <MaterialCommunityIcons name="magnify" size={28} color="#fff" style={{ opacity: 0.9 }} />
          </TouchableOpacity>
        </View>

        {/* Info Principal */}
        <View style={styles.header}>
          <Text style={styles.cityName}>{weatherData.name}</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>

        {/* Icono Transparente (Opacity) */}
        <View style={styles.mainInfo}>
          <MaterialCommunityIcons 
            name={theme.icon} 
            size={140} 
            color="#fff" 
            style={{ opacity: 0.75 }} // AQUÍ ESTÁ EL TRUCO DE LA TRANSPARENCIA
          />
          <Text style={styles.temperature}>{Math.round(weatherData.main.temp)}°</Text>
          <Text style={styles.condition}>{weatherData.weather[0].description}</Text>
        </View>

        {/* NUEVO: Asistente con Recomendación */}
        <View style={styles.assistantContainer}>
          <Text style={styles.messageText}>“{theme.message}”</Text>
          <View style={styles.recommendationBox}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.recommendationText}>{theme.recommendation}</Text>
          </View>
        </View>

        {/* Detalles */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="water-percent" size={24} color="#fff" style={{ opacity: 0.8 }} />
            <Text style={styles.detailText}>{weatherData.main.humidity}%</Text>
            <Text style={styles.detailLabel}>Humedad</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="weather-windy" size={24} color="#fff" style={{ opacity: 0.8 }} />
            <Text style={styles.detailText}>{weatherData.wind.speed} m/s</Text>
            <Text style={styles.detailLabel}>Viento</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="thermometer" size={24} color="#fff" style={{ opacity: 0.8 }} />
            <Text style={styles.detailText}>{Math.round(weatherData.main.feels_like)}°</Text>
            <Text style={styles.detailLabel}>Sensación</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: height },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 20 },
  errorText: { fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 15 },
  retryButton: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#333', borderRadius: 20 },
  retryText: { color: '#fff' },
  scrollContent: { flexGrow: 1, justifyContent: 'space-between', paddingTop: 50, paddingBottom: 40, paddingHorizontal: 20 },
  
  // ESTILOS BARRA BÚSQUEDA
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)', // Fondo semitransparente
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    marginRight: 10,
  },

  header: { alignItems: 'center' },
  cityName: { fontSize: 40, fontWeight: '300', color: '#fff', letterSpacing: 1 },
  date: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5, textTransform: 'capitalize' },
  
  mainInfo: { alignItems: 'center', marginVertical: 20 },
  temperature: { fontSize: 100, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: {width: 2, height: 2}, textShadowRadius: 10 },
  condition: { fontSize: 24, color: 'rgba(255,255,255,0.9)', textTransform: 'capitalize', marginTop: -10 },
  
  // ESTILOS ASISTENTE
  assistantContainer: { alignItems: 'center', marginBottom: 30 },
  messageText: { fontSize: 20, color: '#fff', fontStyle: 'italic', opacity: 0.9, marginBottom: 15 },
  recommendationBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)', // Un poco más oscuro para resaltar
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    width: '90%',
    justifyContent: 'center'
  },
  recommendationText: { color: '#fff', fontSize: 15, fontWeight: '500', flex: 1, textAlign: 'center' },

  detailsContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 25, paddingVertical: 20, borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1 },
  detailItem: { alignItems: 'center', flex: 1 },
  detailText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 5 },
  detailLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  divider: { width: 1, height: '60%', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center' }
});