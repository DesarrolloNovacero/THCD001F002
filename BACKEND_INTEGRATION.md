# Integración Backend - Frontend Autocompletado y Exportación CSV

## Endpoints Implementados

### 1. Endpoint de Sugerencias de Cédulas

**URL:** `POST /suggest-cedulas`

**Descripción:** Devuelve una lista de cédulas y nombres que coincidan con el término de búsqueda, desde los archivos Headcount y Cesantes.

**Request:**
```
Content-Type: multipart/form-data
- search_term (string): Término de búsqueda (mínimo 2 caracteres)
- headcount (File): Archivo Excel de personal activo
- cesantes (File): Archivo Excel de personal cesante
```

**Response (JSON):**
```json
[
  {
    "cedula": "1712345678",
    "nombre": "Juan Carlos López González",
    "source": "headcount"
  },
  {
    "cedula": "1712345679",
    "nombre": "María José Pérez Díaz",
    "source": "cesantes"
  }
]
```

**Notas:**
- Buscar en ambos archivos (headcount y cesantes)
- El término de búsqueda puede ser parcial (ej: "1712" debe devolver cédulas que empiecen con ese patrón)
- Retornar máximo 10 resultados para optimizar el autocompletado
- El campo `source` debe indicar de dónde vino el registro: `'headcount'` o `'cesantes'`
- Si no hay coincidencias, retornar un array vacío `[]`

### 2. Endpoint de Validación de Cédulas

**URL:** `POST /validate-cedula`

Este endpoint ya existe y se mantiene igual:
- Recibe: lista de cédulas en JSON + archivos
- Devuelve: información de validación y datos del empleado

### 3. Endpoint de Exportación a CSV (NUEVO)

**URL:** `POST /export-csv`

**Descripción:** Recibe los registros de capacitación y genera un archivo CSV con el orden de columnas especificado.

**Request:**
```json
[
  {
    "nombreCurso": "Excel Avanzado",
    "objetivo": "Mejorar habilidades en Excel",
    "empresaFacilitador": "Microsoft",
    "dimensionEvento": "Técnica",
    "lugar": "Sala 1",
    "tipoCapacitacion": "Presencial",
    "modalidad": "Curso",
    "cedula": "1712345678",
    "apellidosNombre": "López González Juan Carlos",
    "cargo": "Analista",
    "genero": "M",
    "unidad": "TI",
    "area": "Sistemas",
    "seccion": "Backend",
    "centroCosto": "001",
    "grupoPersonal": "Profesionales",
    "areaPersonal": "Sistemas",
    "grupoOnu": "Educación",
    "jefeArea": "Carlos Pérez",
    "gerenteArea": "María García",
    "localidad": "Bogotá",
    "ciudad": "Bogotá",
    "fechaInicio": "2024-12-23",
    "fechaCierre": "2024-12-30",
    "horaInicio": "09:00",
    "horaCierre": "17:00",
    "totalHoras": "40",
    "tipoEvento": "Capacitación",
    "dirigido": "Interno",
    "valorCurso": "1000000",
    "mesAnio": "12-2024",
    "calificacion": "90"
  }
]
```

**Response:**
- Archivo CSV descargable con nombre `capacitacion.csv`
- Encoding: UTF-8 con BOM (compatible con Excel)

**Orden de Columnas en CSV:**
```
NOMBRE CURSO
OBJETIVO
EMPRESA / FACILITADOR
DIMENSIÓN DE EVENTO
LUGAR
TIPO DE CAPACITACIÓN
MODALIDAD
CÉDULA
APELLIDOS Y NOMBRE DEL COLABORADOR
CARGO
GENERO
UNIDAD
ÁREA
SECCIÓN
CENTRO DE COSTO
GRUPO DE PERSONAL
ÁREA DE PERSONAL
GRUPO ONU
JEFE DE ÁREA
GERENTE DE AREA
LOCALIDAD
CIUDAD
FECHA INICIO
FECHA CIERRE
HORA INICIO
HORA CIERRE
TOTAL HORAS / HORA CAPACITADA
TIPO EVENTO
DIRIGIDO
VALOR CURSO
MES-AÑO
CALIFICACIÓN
```

## Flujo de Funcionamiento

### Modo Individual (Single)
1. Usuario escribe en el campo de cédula → Debounce 300ms
2. Se llama `/suggest-cedulas` con el término
3. Se muestran sugerencias con cédula y nombre
4. Usuario selecciona con mouse o teclado
5. Al guardar, se envía a `/export-csv` para generar CSV

### Modo Masivo (Bulk)
1. Usuario escribe en cada fila → Debounce 300ms por fila
2. Se llama `/suggest-cedulas` para cada fila que tiene contenido
3. Cada fila muestra sus propias sugerencias
4. Usuario selecciona de su fila respectiva
5. Al guardar, se envía a `/export-csv` con todos los registros validados

## Cambios en el Frontend

### Index.tsx
- `handleSave()` ahora es `async`
- Prepara los datos en el formato esperado por el backend
- Envía POST a `/export-csv`
- Descarga el archivo CSV generado
- Limpia el localStorage al completar

### Flujo de Exportación
1. Usuario hace click en "Guardar"
2. Se preparan los datos (modo individual o masivo)
3. Se envían a `/export-csv`
4. Backend genera CSV con las columnas en el orden especificado
5. Se descarga automáticamente
6. Se limpian los datos guardados localmente

## Manejo de Errores

Si el endpoint `/export-csv` retorna error:
- Se muestra un toast con el mensaje de error
- No se limpia el localStorage (los datos se mantienen)
- El usuario puede reintentar

## Notas de Implementación

- El backend utiliza el módulo `csv` de Python para generar el archivo
- Se usa `io.StringIO()` para generar el CSV en memoria
- El encoding es UTF-8 con BOM para mejor compatibilidad con Excel
- Se usa `StreamingResponse` para retornar el archivo como descarga

