const pg = require('pg');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(require('morgan')('dev'))

app.get('/api/departments', async(req, res, next) => {
    try {
        const SQL = `
        SELECT * FROM departments
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch(err) {
        next(err);
    }
})

app.get('/api/employees', async(req, res, next) => {
    try {
        const SQL = `
        SELECT * FROM employees ORDER BY created_at DESC
        `;
        const response = await client.query(SQL);
        res.send(response.row);
    } catch(err) {
        next(err);
    }
})
app.post('/api/employees', async(req, res, next) => {
    try {
        const SQL = `
        INSERT INTO employees(name, department_id)
        VALUES($1, $2)
        RETURNING *;
        `;
        const response = await client.query(SQL, [req.body.name, req.body.department_id]);
        res.send(response.rows[0]);
    } catch(err) {
        next(err);
    }
})
app.put('/api/employees/:id', async(req, res, next) => {
    try {
        const SQL = `
        UPDATE employees
        SET name=$1, department_id=$2, updated_at=now()
        WHERE id = $3`;
        // id = $3 is coming from :id
        const response = await client.query(SQL, (req.body.name, req.body.department_id, req.params.id));
        res.send(response.rows[0]);
    } catch(err) {
        next(err);
    }
})

app.delete('/api/employees/:id', async(req, res, next) => {
    try {
        const SQL = `
        DELETE FROM employees
        WHERE id = $3;
        `;
        // id = $3 is coming from :id
        await client.query(SQL, (req.params.id));
        res.sendStatus(204);
    } catch(err) {
        next(err);
    }
})


// error function 
app.use((err, req, res, next) => {
    res.status(500).send({ error: err.message});
})

const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_departments_db');

async function init() {
    client.connect();
    //notes has to first because categories is the parent table
    const SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;

    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(30) NOT NULL
    );

    
    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        department_id INTEGER REFERENCES departments(id) NOT NULL
    );

    INSERT INTO departments(name) VALUES('Schedules');
    INSERT INTO departments(name) VALUES('Pay');

    INSERT INTO employees(name, department_id)
    VALUES('Sean Bates', (SELECT id FROM departments WHERE name = 'Schedules'));
    
    INSERT INTO employees(name, department_id)
    VALUES('Tim Lawler', (SELECT id FROM departments WHERE name = 'Pay'));
    
    `;
//using (SELECT id FROM categories WHERE name = 'Work') is more robust and doesnt depend on the order more useful then getting id 1

    //schema is a blueprint for your database
    await client.query(SQL);

    app.listen(PORT, () => {
        console.log(`server listening on ${PORT}`);
    })
}

init();