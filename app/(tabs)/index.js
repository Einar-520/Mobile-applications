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
  TextInput,
  TouchableOpacity,
  Keyboard,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

const API_KEY = 'b82d29a256abd95b0a06d27d33955eb1'; 
const { width, height } = Dimensions.get('window');

const MOCK_USERS = [
  { email: 'usuario@prueba.com', password: 'Password1!' } 
];

function LoginScreen({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    let valid = true;
    let tempErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      tempErrors.email = 'Ingresa un correo válido.';
      valid = false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-_&%$#"!=]).{8,}$/;
    
    if (!passwordRegex.test(password)) {
      tempErrors.password = 'La contraseña debe tener: 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y un símbolo (-_&%$#"!=).';
      valid = false;
    }

    setErrors(tempErrors);
    return valid;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (isRegistering) {
      const userExists = MOCK_USERS.find(u => u.email === email);
      if (userExists) {
        Alert.alert('Error', 'Este correo ya está registrado.');
        return;
      }

      MOCK_USERS.push({ email, password });
      Alert.alert('Éxito', 'Cuenta creada correctamente. Ahora inicia sesión.');
      setIsRegistering(false); 

    } else {
      const user = MOCK_USERS.find(u => u.email === email && u.password === password);
      
      if (user) {
        onLoginSuccess(); 
      } else {
        const emailExists = MOCK_USERS.find(u => u.email === email);
        if (!emailExists) {
          Alert.alert('Error', 'El correo no existe. Regístrate primero.');
        } else {
          Alert.alert('Error', 'Contraseña incorrecta.');
        }
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.loginContainer}>
          <StatusBar barStyle="light-content" />
          <LinearGradient colors={['#141E30', '#243B55']} style={styles.background} />

          <View style={styles.loginCard}>
            <MaterialCommunityIcons name="weather-partly-cloudy" size={80} color="#fff" style={{marginBottom: 20}} />
            <Text style={styles.loginTitle}>{isRegistering ? 'Crear Cuenta' : 'Bienvenido'}</Text>
            
            {/* Input Email */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#fff" style={{marginRight: 10}} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Input Password */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#fff" style={{marginRight: 10}} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <TouchableOpacity style={styles.loginButton} onPress={handleSubmit}>
              <Text style={styles.loginButtonText}>{isRegistering ? 'Registrarse' : 'Iniciar Sesión'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {
              setIsRegistering(!isRegistering);
              setErrors({}); // Limpiar errores al cambiar
            }}>
              <Text style={styles.switchText}>
                {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}


function WeatherComponent({ onLogout }) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
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
        setErrorMsg('Se necesita permiso de ubicación.');
        setLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      await fetchWeather(`lat=${location.coords.latitude}&lon=${location.coords.longitude}`);
    } catch (error) {
      console.error(error);
      setErrorMsg('Error al obtener ubicación.');
      setLoading(false);
    }
  };

  const searchCity = async () => {
    if (searchText.trim() === '') return;
    Keyboard.dismiss();
    setLoading(true);
    setErrorMsg(null);
    await fetchWeather(`q=${searchText}`);
    setSearchText('');
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
      setErrorMsg('No encontramos esa ciudad.');
      setLoading(false);
    }
  };

  const getWeatherTheme = (weatherMain) => {
    switch (weatherMain) {
      case 'Clear': return { colors: ['#4da0b0', '#d39d38'], icon: 'weather-sunny', message: 'Cielo despejado.', recommendation: '☀️ Excelente día para lavar ropa.' };
      case 'Clouds': return { colors: ['#D7D2CC', '#304352'], icon: 'weather-cloudy', message: 'Nublado.', recommendation: '🌥️ Buen clima para trabajar concentrado.' };
      case 'Rain': 
      case 'Drizzle': return { colors: ['#005C97', '#363795'], icon: 'weather-rainy', message: 'Lluvia.', recommendation: '☔ No olvides el paraguas.' };
      case 'Thunderstorm': return { colors: ['#232526', '#414345'], icon: 'weather-lightning', message: 'Tormenta.', recommendation: '⛈️ Desconecta equipos sensibles.' };
      case 'Snow': return { colors: ['#83a4d4', '#b6fbff'], icon: 'weather-snowy', message: 'Nieve.', recommendation: '☃️ ¡Abrígate mucho!' };
      default: return { colors: ['#3a7bd5', '#3a6073'], icon: 'weather-partly-cloudy', message: 'Clima tranquilo.', recommendation: '😊 Disfruta tu día.' };
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0000ff" /></View>;
  
  if (errorMsg) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity onPress={loadCurrentLocationWeather} style={styles.retryButton}><Text style={styles.retryText}>Reintentar</Text></TouchableOpacity>
      </View>
    );
  }

  const theme = getWeatherTheme(weatherData.weather[0].main);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={theme.colors} style={styles.background} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header con botón de Salir */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 30 }}>
            <TouchableOpacity onPress={onLogout} style={{ padding: 10 }}>
                <MaterialCommunityIcons name="logout" size={24} color="#fff" />
            </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ciudad..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={searchCity}
          />
          <TouchableOpacity onPress={searchCity}>
            <MaterialCommunityIcons name="magnify" size={28} color="#fff" style={{ opacity: 0.9 }} />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.cityName}>{weatherData.name}</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>

        <View style={styles.mainInfo}>
          <MaterialCommunityIcons name={theme.icon} size={140} color="#fff" style={{ opacity: 0.75 }} />
          <Text style={styles.temperature}>{Math.round(weatherData.main.temp)}°</Text>
          <Text style={styles.condition}>{weatherData.weather[0].description}</Text>
        </View>

        <View style={styles.assistantContainer}>
          <Text style={styles.messageText}>“{theme.message}”</Text>
          <View style={styles.recommendationBox}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.recommendationText}>{theme.recommendation}</Text>
          </View>
        </View>

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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return <WeatherComponent onLogout={() => setIsLoggedIn(false)} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: height },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loginCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  loginTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, height: 50, width: '100%' },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  loginButton: { backgroundColor: '#4da0b0', paddingVertical: 15, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  switchText: { color: '#ddd', marginTop: 20, textDecorationLine: 'underline' },
  errorText: { color: '#ff6b6b', fontSize: 12, alignSelf: 'flex-start', marginBottom: 10, marginLeft: 5 },

  scrollContent: { flexGrow: 1, justifyContent: 'space-between', paddingBottom: 40, paddingHorizontal: 20 },
  searchContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 30, paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  searchInput: { flex: 1, color: '#fff', fontSize: 18, marginRight: 10 },
  header: { alignItems: 'center' },
  cityName: { fontSize: 40, fontWeight: '300', color: '#fff', letterSpacing: 1 },
  date: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5, textTransform: 'capitalize' },
  mainInfo: { alignItems: 'center', marginVertical: 20 },
  temperature: { fontSize: 100, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: {width: 2, height: 2}, textShadowRadius: 10 },
  condition: { fontSize: 24, color: 'rgba(255,255,255,0.9)', textTransform: 'capitalize', marginTop: -10 },
  assistantContainer: { alignItems: 'center', marginBottom: 30 },
  messageText: { fontSize: 20, color: '#fff', fontStyle: 'italic', opacity: 0.9, marginBottom: 15 },
  recommendationBox: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)', padding: 15, borderRadius: 15, alignItems: 'center', width: '90%', justifyContent: 'center' },
  recommendationText: { color: '#fff', fontSize: 15, fontWeight: '500', flex: 1, textAlign: 'center' },
  detailsContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 25, paddingVertical: 20, borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1 },
  detailItem: { alignItems: 'center', flex: 1 },
  detailText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 5 },
  detailLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  divider: { width: 1, height: '60%', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center' },
  retryButton: { marginTop: 20, padding: 10, backgroundColor: '#007AFF', borderRadius: 5 },
  retryText: { color: '#fff' }
});