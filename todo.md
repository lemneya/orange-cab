# Vehicle Fleet Dashboard - TODO

## Core Features

- [x] Database schema for vehicles and documents
- [x] Searchable vehicle list with filters (TAG#, City, Make, Model, Year, VIN)
- [x] Vehicle detail view with all metadata
- [x] Document upload system with categories (Title, Purchase Bill, State Inspection, Registration, Insurance, City Inspection)
- [x] Visual indicators for expired/upcoming expiration dates
- [x] Import vehicle data from Google Sheets
- [x] Responsive dashboard layout with sidebar navigation
- [x] Vehicle CRUD operations (add, edit, delete)
- [x] Document preview and download functionality

## Backend Tasks

- [x] Create vehicles table schema
- [x] Create documents table schema
- [x] Vehicle list API with search and filters
- [x] Vehicle CRUD procedures
- [x] Document upload procedure
- [x] Document list/delete procedures
- [x] Google Sheets import procedure

## Frontend Tasks

- [x] Dashboard layout with sidebar
- [x] Vehicle list page with search/filters
- [x] Vehicle detail page
- [x] Add/Edit vehicle form
- [x] Document upload component
- [x] Document list with preview/download
- [x] Expiration status badges
- [x] Import from Google Sheets UI

## Bug Fixes

- [x] Fix bulk import date parsing - dates sent as strings instead of Date objects

## New Features - Maintenance History

- [x] Maintenance records database table
- [x] Maintenance CRUD API procedures
- [x] Maintenance history UI in vehicle detail page
- [x] Add maintenance record form

## New Features - Drivers & Service Integration

- [x] Drivers database table (name, phone, email, license, assigned vehicle)
- [x] Driver CRUD API procedures
- [x] Driver management UI page
- [x] Link drivers to vehicles (vehicle assignment)
- [x] Service records enhancement (oil changes, tire rotations, repairs)
- [x] Service type categories (Oil Change, Tire Service, Brake Service, etc.)
- [x] Import drivers from spreadsheet
- [x] Import service/oil change records from spreadsheet
- [x] Dashboard statistics for drivers and services
- [x] Driver detail view with assigned vehicle history
