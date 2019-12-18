//Requerir el interfaz http
const http = require('http');
const MongoClient = require('mongodb').MongoClient;
const querystring = require('querystring');

//Especificar la URL de conexión por defecto al servidor local
const urlMongo = 'mongodb://localhost:27017';

//Nombre de la base de datos a la que conectarse
const dbName = 'personas';

//Crear una instancia del cliente de MongoDB
const client = new MongoClient(urlMongo, {useUnifiedTopology: true});

//Definir el puerto a utilizar
const port = 3000;

//Crear el servidor y definir la respuesta que se le da a las peticiones
const server = http.createServer((request, response) => {
    //Extraer el contenido de la petición
    const { headers, method, url } = request;
    console.log('headers: ', headers);
    console.log('method: ', method);
    console.log('url: ', url);

    let body = [];
    request.on('error', (err) => {
        console.error(err);
    }).on('data', (chunk) => {
        //El cuerpo de la petición puede venir en partes, aquí se concatenan
        body.push(chunk);
    }).on('end', () => {
        //El cuerpo de la petición está completo
        body = Buffer.concat(body).toString();

        console.log('body: ', body);
        var parsed = querystring.parse(body);

        const document = {
            "name": parsed.name,
            "phone": parsed.phone
        };

        //Una vez se tiene el documento a insertar, se conecta a la bbdd y se inserta para despues listarlo
        client.connect().then(async () => {
            console.log("Conectado con éxito al servidor");
            db = client.db(dbName);

            const collection = db.collection('personas');

            //Validación para utilizar con Postman únicamente
            if(document.name.length < 3) {
                response.end('El nombre tiene que tener un minimo de 3 caracteres');
            } else if(document.phone.length < 9) {
                response.end('El telefono tiene que tener un minimo de 9 numeros');
            } else {
                await  collection.insertOne(document);
           }

            const resultList = await collection.find({}).toArray();

            //Para lo que nos interesa, es decir, insertar valores con Postman, nos conviene tener la bbdd siempre conectada
            //client.close();

            //Si sale bien, se responde con el listado de usuarios insertados.

            //Código de estado HTTP que se devuelve
            response.statusCode = 200;
            //Encabezados de la respuesta, texto plano
            response.setHeader('Content-Type', 'text/json');
            //Contenido de la respuesta
            response.end(JSON.stringify(resultList));

        }).catch((error) => {
            console.log("Se produjo algún error en las operaciones con la base de datos: " + error);
            //client.close();

            //Código de estado HTTP que se devuelve
            response.statusCode = 500;
            //Encabezados de la respuesta, texto plano
            response.setHeader('Content-Type', 'text/plain');
            //Contenido de la respuesta
            response.end('Se produjo algún error');
        });
    });
});

//Ejecutar el servicio para que permanezca a la espera de peticiones
server.listen(port, () => {
    console.log('Servidor ejecutándose...');
    console.log('Abrir en un navegador http://localhost:3000');
});
