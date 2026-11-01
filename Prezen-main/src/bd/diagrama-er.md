roles {
    int id PK
    varchar nombre "admin | coordinador | director_grupo | padre_familia | estudiante"
}
USUARIOS {
    uuid id PK_FK "= auth.users.id"
    varchar nombre
    int rol_id FK
    varchar estado "activo | inactivo"
    datetime creado_en
    datetime actualizado_en
}
GRUPOS {
    int id PK
    varchar nombre "ej. 10-A"
    varchar jornada "mañana | tarde"
    varchar año_lectivo
    uuid director_usuario_id FK "director de grupo asignado"
    datetime creado_en
}
COORDINADORES_GRUPO {
    int id PK
    int grupo_id FK
    uuid coordinador_usuario_id FK
    unique "(grupo_id, coordinador_usuario_id)"
}
ESTUDIANTES_GRUPO {
    int id PK
    int grupo_id FK
    uuid estudiante_usuario_id FK
    varchar codigo_qr UK "identificador único, va codificado en el QR"
    varchar estado "activo | retirado"
    datetime creado_en
}
ACUDIENTES_ESTUDIANTE {
    int id PK
    uuid padre_usuario_id FK
    uuid estudiante_usuario_id FK
    varchar parentesco
    unique "(padre_usuario_id, estudiante_usuario_id)"
}
SESIONES_ASISTENCIA {
    int id PK
    int grupo_id FK
    uuid coordinador_usuario_id FK
    date fecha
    varchar tipo "entrada | salida"
    varchar estado "abierta | cerrada"
    datetime abierta_en
    datetime cerrada_en
    unique "(grupo_id, fecha, tipo)"
}
REGISTROS_ASISTENCIA {
    int id PK
    int sesion_id FK
    uuid estudiante_usuario_id FK
    varchar metodo "qr | manual"
    varchar estado "presente | tardanza | ausente"
    uuid registrado_por_usuario_id FK
    datetime hora_registro
    unique "(sesion_id, estudiante_usuario_id)"
}
NOTIFICACIONES {
    int id PK
    uuid usuario_id FK
    varchar tipo
    varchar contenido
    varchar referencia_tipo
    int referencia_id
    boolean leida
    datetime creado_en
}
AUDITORIA_ACCIONES {
    int id PK
    uuid admin_usuario_id FK
    varchar accion
    varchar objetivo_tipo
    varchar objetivo_id
    datetime creado_en
}

ROLES ||--o{ USUARIOS : tiene
USUARIOS ||--o{ GRUPOS : "dirige (director)"
GRUPOS ||--o{ COORDINADORES_GRUPO : asigna
USUARIOS ||--o{ COORDINADORES_GRUPO : "coordina"
GRUPOS ||--o{ ESTUDIANTES_GRUPO : agrupa
USUARIOS ||--o| ESTUDIANTES_GRUPO : "es (estudiante)"
USUARIOS ||--o{ ACUDIENTES_ESTUDIANTE : "es acudiente de"
GRUPOS ||--o{ SESIONES_ASISTENCIA : abre
SESIONES_ASISTENCIA ||--o{ REGISTROS_ASISTENCIA : contiene
USUARIOS ||--o{ NOTIFICACIONES : recibe