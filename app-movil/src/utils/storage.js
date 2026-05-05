import AsyncStorge from '@react-native-async-storage/async-storage';

const memoryStore = new Map();

// Respaldo tempora en memoria asi AsyncStorage 

// Ejecuta una funcion async y si falla devuelve un valor por defecto
// Se usa para centralizar el manejo de errores sileciosos de errores
async function safeCall(fn, fallbackValue) {
    try {
        return await fn();
    } catch {
        return fallbackValue;
    }
}

// Lee una clave del almacenamiento
// Primero intenta por AsyncStorage y si falla isa el respaldo  de memoria
export async function storageGetItem(key) {
    const value = await safeCall(() => AsyncStorge.getItem(key), null);
    
    if (value !== null ) {
        return value;
    }
    return memoryStore.has(key) ? memoryStore.get(key): null;
}

// Guarda una clave de AsyncStorage
// Si no puede persistir, el la almacena en la memoria virtual
export async function storageSetItem(key, value) {
    const ok = await safeCall (async() => {
      await AsyncStorge.setItem(key, value);
      return true;  
    }, false);

    if (!ok) {
        memoryStore.set(key, value);
    }
}

// Elimina varios claves a la vez
// Siempre limpia primero el respaldo en memoria y luego intenta en asynstorage
export async function storageMultiRemove(keys) {
    key.forEach((key) => memoryStore.delete(key));
    await safeCall(async() => {
        await AsyncStorge.storageMultiRemove(keys);
    }, null);

}