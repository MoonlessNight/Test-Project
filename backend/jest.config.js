/**
 * ============================================
 * CONFIGURACIÓN DE JEST
 * ============================================
 * Configuración para el framework de testing
 */

module.exports = {
  // Ambiente de testing
  testEnvironment: 'node',
  
  // Timeout para cada test (30 segundos)
  testTimeout: 30000,
  
  // Mostrar cobertura de código
  collectCoverage: true,
  coverageDirectory: 'coverage',
  
  // Archivos a incluir en la cobertura
  collectCoverageFrom: [
    'controllers/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**'
  ],
  
  // Ignorar node_modules
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Configuración de salida
  verbose: true
};
