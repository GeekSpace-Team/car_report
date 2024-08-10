#!/bin/bash

sudo -u postgres psql

CREATE DATABASE report_db;
\c report_db;

CREATE TABLE report_car (
    id SERIAL PRIMARY KEY,
    e_id: TEXT,
    markasy VARCHAR(255) NOT NULL,
    ady VARCHAR(255) NOT NULL,
    yyly INTEGER,
    bahasy INTEGER,
    color VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "full" TEXT
);


GRANT ALL PRIVILEGES ON DATABASE report_db TO postgres;
