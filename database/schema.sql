-- Transporter Database Schema for Supabase PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION getdate() RETURNS TIMESTAMP WITHOUT TIME ZONE AS $$
BEGIN
    RETURN CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION isnull(val ANYELEMENT, defval ANYELEMENT) RETURNS ANYELEMENT AS $$
BEGIN
    RETURN COALESCE(val, defval);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION scope_identity() RETURNS BIGINT AS $$
BEGIN
    RETURN LASTVAL();
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TABLE IF EXISTS asn_master CASCADE;
CREATE TABLE asn_master (
    id SERIAL,
    vin VARCHAR(50),
    modelcode VARCHAR(50),
    modelname VARCHAR(100),
    dealercode VARCHAR(50),
    origincode VARCHAR(50),
    destinationcode VARCHAR(50),
    originterminal VARCHAR(100) NOT NULL,
    destinationterminal VARCHAR(100) NOT NULL,
    invoiceno VARCHAR(50),
    invoiceamount NUMERIC DEFAULT 0 NOT NULL,
    invoicedate DATE,
    shipmentno VARCHAR(50),
    createdat TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedat TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pk_asn_master PRIMARY KEY (id)
);

DROP TABLE IF EXISTS companies CASCADE;
CREATE TABLE companies (
    id SERIAL,
    company_code VARCHAR(50) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    logo_url VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(30),
    address_line1 VARCHAR(500),
    address_line2 VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    tax_number VARCHAR(100),
    registration_number VARCHAR(100),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pk_companies PRIMARY KEY (id)
);

DROP TABLE IF EXISTS company_master CASCADE;
CREATE TABLE company_master (
    company_code VARCHAR(10) NOT NULL,
    company_name VARCHAR(50),
    company_class VARCHAR(8),
    pan_no VARCHAR(15),
    tan_no VARCHAR(20),
    service_tax_reg VARCHAR(30),
    contact_person VARCHAR(30),
    contact_no VARCHAR(20),
    email_id VARCHAR(100),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pin VARCHAR(100),
    remarks VARCHAR(500),
    website VARCHAR(100),
    ci_no VARCHAR(30),
    state_code VARCHAR(50),
    gstin VARCHAR(20),
    faxno VARCHAR(20),
    company_id INTEGER,
    org_id VARCHAR(200),
    user_id VARCHAR(100),
    password VARCHAR(100)
);

DROP TABLE IF EXISTS customer_master CASCADE;
CREATE TABLE customer_master (
    customerid SERIAL,
    customername VARCHAR(255) NOT NULL,
    customertype VARCHAR(50),
    contactperson VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    addressline1 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postalcode VARCHAR(20),
    country VARCHAR(100),
    isconsigner BOOLEAN DEFAULT false NOT NULL,
    isconsignee BOOLEAN DEFAULT false NOT NULL,
    createddate TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    modifieddate TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT pk_customer_master PRIMARY KEY (customerid)
);

DROP TABLE IF EXISTS driver_master CASCADE;
CREATE TABLE driver_master (
    driver_id NUMERIC,
    vendor_id NUMERIC NOT NULL,
    terminal_id NUMERIC,
    driver_name VARCHAR(100),
    address VARCHAR(300),
    vehicle_id NUMERIC,
    vehicle_no VARCHAR(20),
    contact_no VARCHAR(50),
    mobile_no VARCHAR(50),
    email_id VARCHAR(300),
    blood_group VARCHAR(300),
    joining_date DATE,
    dl_no VARCHAR(50),
    dl_renewable_date DATE,
    salary NUMERIC,
    active_flage VARCHAR(1),
    created_by VARCHAR(30),
    created_on TIMESTAMP WITHOUT TIME ZONE,
    image VARCHAR(200),
    bal_amt VARCHAR(10),
    trip_bal NUMERIC,
    close_status INTEGER,
    jo_close_status VARCHAR(10),
    gaurantor VARCHAR(100),
    driver_code VARCHAR(10),
    father_name VARCHAR(100),
    attach_status VARCHAR(10),
    dl_doc VARCHAR(300),
    address_doc VARCHAR(300),
    emerg_phone VARCHAR(20),
    phone_no VARCHAR(20),
    CONSTRAINT pk_driver_master PRIMARY KEY (driver_id)
);

DROP TABLE IF EXISTS fleet_equipment_master CASCADE;
CREATE TABLE fleet_equipment_master (
    terminal_id NUMERIC,
    equipment_id NUMERIC NOT NULL,
    equipment_no VARCHAR(20),
    equipment_type VARCHAR(5),
    purchage_date DATE,
    insurance_no VARCHAR(100),
    eng_no VARCHAR(100),
    eng_type VARCHAR(50),
    vin_no VARCHAR(100),
    manufacturing_year INTEGER,
    model VARCHAR(50),
    condition VARCHAR(1),
    tare_wt NUMERIC,
    gross_wt NUMERIC,
    status VARCHAR(1),
    created_on TIMESTAMP WITHOUT TIME ZONE,
    created_by VARCHAR(30),
    bed_changeable VARCHAR(1),
    image VARCHAR(100),
    registration_date DATE,
    manufacturer NUMERIC,
    bed_no VARCHAR(50),
    ins_vendor NUMERIC,
    ins_validity DATE,
    permit_from DATE,
    permit_to DATE,
    pollution_validity DATE,
    rto VARCHAR(100),
    fitness_doc VARCHAR(200),
    validity DATE,
    rc_doc VARCHAR(200),
    insurance_doc VARCHAR(200),
    permit_a VARCHAR(200),
    permit_b VARCHAR(200),
    hp_by NUMERIC,
    xl_type VARCHAR(20),
    company_id NUMERIC,
    driver_attach_id NUMERIC,
    driver_attcah_status VARCHAR(10),
    state_permit_from DATE,
    state_permit_to DATE,
    road_tax_validity DATE,
    remark_note VARCHAR(500),
    vender_id NUMERIC,
    customer_id INTEGER,
    location_id INTEGER
);

DROP TABLE IF EXISTS images CASCADE;
CREATE TABLE images (
    id SERIAL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(255) NOT NULL,
    uploaddate TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    isactive BOOLEAN DEFAULT true,
    image_data BYTEA,
    content_type VARCHAR(100),
    project_id INTEGER,
    access_token VARCHAR(100),
    CONSTRAINT pk_images PRIMARY KEY (id)
);

DROP TABLE IF EXISTS location_master CASCADE;
CREATE TABLE location_master (
    location_ref_id NUMERIC,
    terminal_id NUMERIC,
    location_id NUMERIC,
    location_name VARCHAR(200),
    distance NUMERIC,
    toll NUMERIC,
    advance_rs NUMERIC,
    oil_advance NUMERIC,
    al_advance NUMERIC,
    double_twenty NUMERIC,
    customer_id NUMERIC,
    handover_location INTEGER,
    double_20_oil NUMERIC,
    oil_20 NUMERIC,
    oil_40 NUMERIC,
    vehicle_type VARCHAR(30),
    CONSTRAINT pk_location_master PRIMARY KEY (location_id)
);

DROP TABLE IF EXISTS payment_details CASCADE;
CREATE TABLE payment_details (
    id SERIAL,
    transaction_id INTEGER NOT NULL,
    invoice_id VARCHAR(50) NOT NULL,
    amount NUMERIC NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    payment_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    remarks VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_payment_details PRIMARY KEY (id)
);

DROP TABLE IF EXISTS payment_receipts CASCADE;
CREATE TABLE payment_receipts (
    id SERIAL,
    request_id INTEGER NOT NULL,
    invoice_no VARCHAR(100) NOT NULL,
    invoice_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    invoice_amount NUMERIC NOT NULL,
    received_amount NUMERIC DEFAULT 0.00,
    balance NUMERIC,
    payment_status VARCHAR(20) DEFAULT 'Pending',
    voucher_no VARCHAR(100),
    voucher_date TIMESTAMP WITHOUT TIME ZONE,
    payment_mode VARCHAR(50),
    payment_date TIMESTAMP WITHOUT TIME ZONE,
    customer_id INTEGER NOT NULL,
    remarks VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    company_id INTEGER,
    CONSTRAINT pk_payment_receipts PRIMARY KEY (id)
);

DROP TABLE IF EXISTS payment_transactions CASCADE;
CREATE TABLE payment_transactions (
    id SERIAL,
    receipt_id INTEGER NOT NULL,
    payment_amount NUMERIC NOT NULL,
    voucher_no VARCHAR(100),
    voucher_date TIMESTAMP WITHOUT TIME ZONE,
    payment_mode VARCHAR(50),
    payment_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    remarks VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_payment_transactions PRIMARY KEY (id)
);

DROP TABLE IF EXISTS permissions CASCADE;
CREATE TABLE permissions (
    id SERIAL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    CONSTRAINT pk_permissions PRIMARY KEY (id)
);

DROP TABLE IF EXISTS role_permissions CASCADE;
CREATE TABLE role_permissions (
    role_id INTEGER,
    permission_id INTEGER,
    CONSTRAINT pk_role_permissions PRIMARY KEY (role_id, permission_id)
);

DROP TABLE IF EXISTS roles CASCADE;
CREATE TABLE roles (
    id INTEGER,
    role_name VARCHAR(50) NOT NULL,
    CONSTRAINT pk_roles PRIMARY KEY (id)
);

DROP TABLE IF EXISTS service_master CASCADE;
CREATE TABLE service_master (
    terminal_id NUMERIC,
    service_id NUMERIC NOT NULL,
    service_code VARCHAR(20),
    service_name VARCHAR(100),
    service_type_code VARCHAR(1),
    tax_group_id NUMERIC,
    unit VARCHAR(100),
    map_code VARCHAR(100),
    tax_on_percentage NUMERIC,
    uom_id NUMERIC,
    sap_map_code VARCHAR(100),
    service_type VARCHAR(1),
    service_group VARCHAR(1),
    exempted VARCHAR(1),
    service_map_code VARCHAR(1),
    created_by VARCHAR(50),
    created_on TIMESTAMP WITHOUT TIME ZONE,
    tpt_mode VARCHAR(1),
    lcl_type VARCHAR(1),
    lcl_per NUMERIC,
    haz_per NUMERIC,
    iwb_flag VARCHAR(1),
    service_group_map VARCHAR(5),
    service VARCHAR(1),
    tally_service_name VARCHAR(200),
    tally_service_agro VARCHAR(200),
    periodic VARCHAR(1),
    add_imp_service_type VARCHAR(1),
    company_id NUMERIC,
    rrj_service_name VARCHAR(200)
);

DROP TABLE IF EXISTS transport_requests CASCADE;
CREATE TABLE transport_requests (
    id SERIAL,
    customer_id INTEGER NOT NULL,
    vehicle_type VARCHAR(100),
    vehicle_size VARCHAR(50),
    consignee VARCHAR(255),
    consigner VARCHAR(255),
    containers_20ft INTEGER DEFAULT 0,
    containers_40ft INTEGER DEFAULT 0,
    total_containers INTEGER DEFAULT 0,
    pickup_location VARCHAR(500),
    stuffing_location VARCHAR(500),
    delivery_location VARCHAR(500),
    commodity VARCHAR(255),
    cargo_type VARCHAR(100),
    cargo_weight NUMERIC,
    service_type TEXT,
    service_prices TEXT,
    expected_pickup_date DATE,
    expected_delivery_date DATE,
    requested_price NUMERIC,
    status VARCHAR(50) DEFAULT 'Pending',
    no_of_vehicles INTEGER DEFAULT 1,
    admin_comment VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    expected_pickup_time VARCHAR(5),
    expected_delivery_time VARCHAR(5),
    vehicle_status VARCHAR(20) DEFAULT 'Empty',
    formatted_request_id VARCHAR(19),
    shipa_no VARCHAR(50),
    is_half_trip BOOLEAN DEFAULT false NOT NULL,
    current_location VARCHAR(255),
    parent_trip_id INTEGER,
    parent_request_id INTEGER,
    combined_invoice_id VARCHAR(100),
    is_parent BOOLEAN DEFAULT true NOT NULL,
    location_id INTEGER,
    company_id INTEGER,
    created_by_user_id INTEGER,
    CONSTRAINT pk_transport_requests PRIMARY KEY (id)
);

DROP TABLE IF EXISTS transport_transaction_master CASCADE;
CREATE TABLE transport_transaction_master (
    id SERIAL,
    request_id INTEGER NOT NULL,
    transporter_id INTEGER NOT NULL,
    gr_no VARCHAR(50) NOT NULL,
    transporter_name VARCHAR(100),
    vehicle_number VARCHAR(20),
    driver_name VARCHAR(100),
    pickup_location VARCHAR(255),
    delivery_location VARCHAR(255),
    consigner VARCHAR(100),
    consignee VARCHAR(100),
    service_type VARCHAR(50),
    requested_price NUMERIC DEFAULT 0,
    transporter_charge NUMERIC DEFAULT 0,
    gst_percentage NUMERIC DEFAULT 0,
    total_paid NUMERIC DEFAULT 0,
    last_payment_amount NUMERIC DEFAULT 0,
    last_payment_date TIMESTAMP WITHOUT TIME ZONE,
    last_payment_mode VARCHAR(50),
    remarks VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    vehicle_payment_status VARCHAR(20),
    company_id INTEGER,
    created_by_user_id INTEGER,
    CONSTRAINT pk_transport_transaction_master PRIMARY KEY (id)
);

DROP TABLE IF EXISTS transporter_details CASCADE;
CREATE TABLE transporter_details (
    id SERIAL,
    request_id INTEGER NOT NULL,
    transporter_name VARCHAR(255) NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    driver_contact VARCHAR(20) NOT NULL,
    license_number VARCHAR(20),
    license_expiry VARCHAR(20),
    base_charge NUMERIC,
    service_charges TEXT,
    additional_charges NUMERIC DEFAULT 0,
    total_charge NUMERIC NOT NULL,
    container_no VARCHAR(100),
    line VARCHAR(100),
    seal_no VARCHAR(100),
    number_of_containers INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    seal1 VARCHAR(100),
    seal2 VARCHAR(100),
    container_total_weight NUMERIC,
    cargo_total_weight NUMERIC,
    container_type VARCHAR(50),
    container_size VARCHAR(20),
    vehicle_sequence INTEGER DEFAULT 1 NOT NULL,
    vin_no VARCHAR(50),
    CONSTRAINT pk_transporter_details PRIMARY KEY (id)
);

DROP TABLE IF EXISTS transporter_list_master CASCADE;
CREATE TABLE transporter_list_master (
    transporter_id SERIAL,
    transporter_name VARCHAR(100) NOT NULL,
    transporter_email VARCHAR(100) NOT NULL,
    transporter_contact VARCHAR(15) NOT NULL,
    company_name VARCHAR(100),
    gst_number VARCHAR(20),
    address_line1 VARCHAR(150),
    address_line2 VARCHAR(150),
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    country VARCHAR(50) DEFAULT 'India',
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_transporter_list_master PRIMARY KEY (transporter_id)
);

DROP TABLE IF EXISTS trip_legs CASCADE;
CREATE TABLE trip_legs (
    id SERIAL,
    request_id INTEGER NOT NULL,
    start_location VARCHAR(255) NOT NULL,
    end_location VARCHAR(255) NOT NULL,
    gr_number VARCHAR(100) NOT NULL,
    price NUMERIC NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_trip_legs PRIMARY KEY (id)
);

DROP TABLE IF EXISTS user_locations CASCADE;
CREATE TABLE user_locations (
    user_id INTEGER,
    location_id INTEGER,
    CONSTRAINT pk_user_locations PRIMARY KEY (user_id, location_id)
);

DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id SERIAL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    role_id INTEGER,
    customer_id INTEGER,
    company_id INTEGER DEFAULT 1 NOT NULL,
    profile_image_url VARCHAR(500),
    CONSTRAINT pk_users PRIMARY KEY (id)
);

DROP TABLE IF EXISTS users2 CASCADE;
CREATE TABLE users2 (
    id SERIAL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    CONSTRAINT pk_users2 PRIMARY KEY (id)
);

DROP TABLE IF EXISTS vehicle_master CASCADE;
CREATE TABLE vehicle_master (
    vehicle_id SERIAL,
    vehicle_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(50),
    make VARCHAR(50),
    model VARCHAR(50),
    year INTEGER,
    chassis_number VARCHAR(50),
    engine_number VARCHAR(50),
    registration_date DATE,
    owner_name VARCHAR(100),
    owner_contact VARCHAR(15),
    insurance_expiry_date DATE,
    fitness_expiry_date DATE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    customer_id INTEGER,
    location_id INTEGER,
    CONSTRAINT pk_vehicle_master PRIMARY KEY (vehicle_id)
);

DROP TABLE IF EXISTS vendor_master CASCADE;
CREATE TABLE vendor_master (
    vendor_id NUMERIC,
    terminal_id NUMERIC,
    vendor_code VARCHAR(50),
    vendor_name VARCHAR(100) NOT NULL,
    address VARCHAR(200),
    city VARCHAR(50),
    pin_code VARCHAR(10),
    state_code VARCHAR(50),
    country VARCHAR(50),
    email_id1 VARCHAR(100),
    email_id2 VARCHAR(100),
    contact_no VARCHAR(50),
    mobile_no VARCHAR(50),
    fax VARCHAR(50),
    payment_terms VARCHAR(1),
    pan VARCHAR(50),
    tan VARCHAR(50),
    service_tax_reg VARCHAR(50),
    bank_name VARCHAR(50),
    ac_map_code VARCHAR(20),
    created_by VARCHAR(30),
    created_on TIMESTAMP WITHOUT TIME ZONE,
    updated_by VARCHAR(30),
    updated_on TIMESTAMP WITHOUT TIME ZONE,
    account_no VARCHAR(30),
    ifsc VARCHAR(20),
    bank_branch VARCHAR(30),
    gstin VARCHAR(30),
    status VARCHAR(20) DEFAULT 'Active',
    image_data BYTEA,
    image_name VARCHAR(255),
    image_type VARCHAR(100),
    document2_data BYTEA,
    document2_name VARCHAR(255),
    document2_type VARCHAR(100),
    document3_data BYTEA,
    document3_name VARCHAR(255),
    document3_type VARCHAR(100),
    document1_data BYTEA,
    document1_name VARCHAR(255),
    document1_type VARCHAR(100),
    CONSTRAINT pk_vendor_master PRIMARY KEY (vendor_id)
);

DROP TABLE IF EXISTS vendor_type CASCADE;
CREATE TABLE vendor_type (
    terminal_id NUMERIC,
    vendor_type_id NUMERIC,
    vendor_type_code VARCHAR(1),
    vendor_type_name VARCHAR(100)
);

DROP TABLE IF EXISTS vendor_type_details CASCADE;
CREATE TABLE vendor_type_details (
    terminal_id NUMERIC,
    vendor_id NUMERIC,
    service_id NUMERIC,
    tds_code VARCHAR(20),
    vender_type_code VARCHAR(1),
    import VARCHAR(1),
    export VARCHAR(1),
    domestic VARCHAR(1),
    status VARCHAR(1),
    vendor_key_id NUMERIC NOT NULL
);

-- Seed Initial Data
-- 1. Default Company
INSERT INTO companies (id, company_code, company_name, email, phone, is_active, created_at, updated_at)
VALUES (1, 'TRANS01', 'Transporter Logistics', 'admin@transporter.com', '9999999999', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 2. Default Roles
INSERT INTO roles (id, role_name) VALUES 
(1, 'admin'),
(2, 'customer'),
(3, 'driver'),
(4, 'transporter')
ON CONFLICT (id) DO NOTHING;

-- 3. Default Users
INSERT INTO users (id, name, email, phone, password, role, role_id, company_id, created_at)
VALUES 
(1, 'admin', 'admin@transporter.com', '9999999999', '$2b$10$T76/54UCPf8hl7ziLBugouYc.VyT03m0ihh8Op4g7Q/j6iYVjYRP.', 'admin', 1, 1, CURRENT_TIMESTAMP),
(2, 'customer', 'customer@transporter.com', '8888888888', '$2b$10$450nWNNOFz8859oLEoBcxe0y1tBBzaXJkuPVXtHuXQdmf9zaBv.sC', 'customer', 2, 1, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (name, email, phone, password, role, role_id, company_id, created_at)
VALUES 
('admin', 'admin', '9999999999', '$2b$10$T76/54UCPf8hl7ziLBugouYc.VyT03m0ihh8Op4g7Q/j6iYVjYRP.', 'admin', 1, 1, CURRENT_TIMESTAMP),
('customer', 'customer', '8888888888', '$2b$10$450nWNNOFz8859oLEoBcxe0y1tBBzaXJkuPVXtHuXQdmf9zaBv.sC', 'customer', 2, 1, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- 4. Default users2 table
INSERT INTO users2 (username, password_hash, role)
VALUES 
('admin', '$2b$10$T76/54UCPf8hl7ziLBugouYc.VyT03m0ihh8Op4g7Q/j6iYVjYRP.', 'admin'),
('customer', '$2b$10$450nWNNOFz8859oLEoBcxe0y1tBBzaXJkuPVXtHuXQdmf9zaBv.sC', 'customer')
ON CONFLICT DO NOTHING;

SELECT setval(pg_get_serial_sequence('companies', 'id'), COALESCE(max(id), 1)) FROM companies;
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(max(id), 1)) FROM users;
