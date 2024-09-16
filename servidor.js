var express = require('express'); // requisita a biblioteca para a criacao dos serviços web.
var pg = require("pg"); // requisita a biblioteca pg para a comunicacao com o banco de dados.

 var sw = express(); // iniciliaza uma variavel chamada app que possitilitará a criação dos serviços e rotas.

sw.use(express.json());//padrao de mensagens em json.
//permitir o recebimento de qualquer origem, aceitar informações no cabeçalho e permitir o métodos get e post
sw.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    next();
});


const config = {
    host: 'localhost',
    user: 'postgres',
    database: 'db_cs_2024',
    password: '123456',
    port: 5432
};

//definia conexao com o banco de dados.
const postgres = new pg.Pool(config);

//definicao do primeiro serviço web.
sw.get('/', (req, res) => {
    res.send('Hello, world! meu primeiro teste.  #####');
})

sw.get('/teste', (req, res) => {
    res.status(201).send('meu teste');
})

sw.get('/listenderecos', function (req, res, next) {
    
    postgres.connect(function(err,client,done) {

       if(err){

           console.log("Nao conseguiu acessar o  BD "+ err);
           res.status(400).send('{'+err+'}');
       }else{            

            var q ='select codigo, complemento, cep, nicknamejogador ' +
                    'from tb_endereco order by codigo asc';            
    
            client.query(q,function(err,result) {
                done(); // closing the connection;
                if(err){
                    console.log('retornou 400 no listendereco');
                    console.log(err);
                    
                    res.status(400).send('{'+err+'}');
                }else{

                    //console.log('retornou 201 no /listendereco');
                    res.status(201).send(result.rows);
                }           
            });
       }       
    });
});

sw.get('/listpatentes', function (req, res, next) {
    
    postgres.connect(function(err,client,done) {

       if(err){
           console.log("Nao conseguiu acessar o  BD "+ err);
           res.status(400).send('{'+err+'}');
       }else{            

            var q ='select codigo, nome, quant_min_pontos, cor, logotipo, to_char(datacriacao, \'dd/mm/yyyy hh24:mi:ss\') as datacriacao  from tb_patente;';            
    
            client.query(q,function(err,result) {
                done(); // closing the connection;
                if(err){
                    console.log('retornou 400 no listendereco');
                    console.log(err);
                    
                    res.status(400).send('{'+err+'}');
                }else{

                    //console.log('retornou 201 no /listendereco');
                    res.status(201).send(result.rows);
                }           
            });
       }       
    });
});

sw.get('/listjogadores', function (req, res, next) {    
    postgres.connect(function(err,client,done) {
       if(err){
           console.log("Nao conseguiu acessar o  BD "+ err);
           res.status(400).send('{'+err+'}');
       }else{            
            var q ='select j.nickname, j.senha, j.quantpontos, 0 as patentes, 0 as endereco '+
                        'from tb_jogador j '+
                        'order by nickname asc;';    
            //Exercicio 1: incluir todas as colunas de tb_endereco
            client.query(q,async function(err,result) {
                
                if(err){
                    console.log('retornou 400 no listjogadores');
                    console.log(err);                    
                    res.status(400).send('{'+err+'}');
                }else{
                    for(var i=0; i < result.rows.length; i++){                                              
                        try { //Exercicio 2: incluir todas as colunas de tb_patente.                         
                              pj = await client.query('select codpatente from '+
                                                      'tb_jogador_conquista_patente '+
                                                      'where nickname = $1', 
                                                             [result.rows[i].nickname])                                                    
                              result.rows[i].patentes = pj.rows;

                              pe = await client.query('select codigo, complemento, cep from '+
                                'tb_endereco '+
                                'where nicknamejogador = $1', 
                                       [result.rows[i].nickname])
                              
                              result.rows[i].endereco = pe.rows[0];
                        } catch (err) {                                                       
                            res.status(400).send('{'+err+'}');
                        }                                           
                    }
                    done(); // closing the connection;
                    //console.log('retornou 201 no /listendereco');                    
                    res.status(201).send(result.rows);
                }           
            });
       }       
    });
});

//Exercicio 1: codificar um serviço para cadastrar jogador com endereço e associar patente(s)

sw.post('/insertjogador', function(req, res, next){

    postgres.connect(function(err,client,done) {
        if(err){
            console.log("Nao conseguiu acessar o  BD "+ err);
            res.status(400).send('{'+err+'}');
        }else{
            //insert tb_jogador
            var q1 = {
                text: 'insert into tb_jogador (nickname, senha, quantpontos, quantdinheiro, situacao) values ($1, $2, $3, $4, $5) returning nickname, 0 as patentes',
                values : [req.body.nickname, req.body.senha, req.body.quantpontos, req.body.quantdinheiro, req.body.situacao]
            }            
            // insert em tb_endereco
            client.query(q1, function(err,result1) {
                if(err){
                    console.log('retornou 400 no insert q1 em tb_jogador');
                    res.status(400).send('{'+err+'}');
                }else{
                    var q2 = {
                        text: 'insert into tb_endereco (complemento, cep, nicknamejogador) values ($1, $2, $3)',
                        values : [req.body.endereco.complemento, req.body.endereco.cep, req.body.nickname]
                    } 

                    client.query(q2, async function(err, result2){

                        if(err){
                            console.log('retornou 400 no insert q2 em tb_endereco');
                            res.status(400).send('{'+err+'}');
                        }else{

                            for(var i=0; i < req.body.patentes.length; i++){                                              
                                try { //Exercicio 2: incluir todas as colunas de tb_patente.                         
                                      pj = await client.query('insert into tb_jogador_conquista_patente (nickname, codpatente) values ($1, $2)',
                                        [req.body.nickname, req.body.patentes[i].codpatente]
                                      )

                                }catch (error){
                                    console.log('retornou 400 no insert for em tb_jogador_conquista_patente');
                                    console.log(error)
                                    res.status(400).send('{'+error+'}');
                                }
                            }
                            done(); // closing the connection;
                            res.status(200).send({"nickname" : result1.rows[0].nickname, "patentes" : req.body.patentes})

                        }
                    })
                
                }
            })
        }
       
    });
});

//Exercicio 2: codificar um serviço para alterar jogador

sw.post('/insertpatente', function(req, res, next){

    postgres.connect(function(err,client,done) {
        if(err){
            console.log("Nao conseguiu acessar o  BD "+ err);
            res.status(400).send('{'+err+'}');
        }else{

            var q1 = {
                text: 'insert into tb_patente (nome, quant_min_pontos, datacriacao, cor, logotipo) '
                       + ' values ($1, $2, now(), $3, $4) returning codigo, nome, quant_min_pontos, '+
                       'to_char(datacriacao, \'dd/mm/yyyy hh24:mi:ss\') as datacriacao, logotipo ',
                values : [req.body.nome, req.body.quant_min_pontos, req.body.cor, req.body.logotipo]
            }
            client.query(q1, function(err,result1) {
                if(err){
                    console.log('retornou 400 no insert q1');
                    res.status(400).send('{'+err+'}');
                }else{
                    console.log('retornou 201 no insertpatente');
                    res.status(201).send({"codigo": result1.rows[0].codigo,
                                          "nome"  : result1.rows[0].nome,
                                          "quant_min_pontos" : result1.rows[0].quant_min_pontos,
                                          "datacriacao" : result1.rows[0].datacriacao,
                                          "logotipo" : result1.rows[0].logotipo
                    });
                }
            });

        }
    });
});

sw.post('/updatepatente', function(req, res, next){

    postgres.connect(function(err,client,done) {
        if(err){
            console.log("Nao conseguiu acessar o  BD "+ err);
            res.status(400).send('{'+err+'}');
        }else{

            var q1 = {
                text: 'update tb_patente  set  nome = $1, quant_min_pontos = $2, cor = $3, logotipo = $4 '
                       + ' where codigo = $5 returning codigo, nome, quant_min_pontos, '+
                       'to_char(datacriacao, \'dd/mm/yyyy hh24:mi:ss\') as datacriacao, logotipo, cor ',
                values : [req.body.nome, req.body.quant_min_pontos, req.body.cor, req.body.logotipo, req.body.codigo]
            }
            client.query(q1, function(err,result1) {
                if(err){
                    console.log('retornou 400 no updatepatente q1');
                    res.status(400).send('{'+err+'}');
                }else{
                    console.log('retornou 201 no udpatepatente');
                    res.status(201).send({"codigo": result1.rows[0].codigo,
                                          "nome"  : result1.rows[0].nome,
                                          "quant_min_pontos" : result1.rows[0].quant_min_pontos,
                                          "datacriacao" : result1.rows[0].datacriacao,
                                          "logotipo" : result1.rows[0].logotipo,
                                          "cor" : result1.rows[0].cor
                    });
                }
            });

        }
    });
});

sw.get('/deletepatente/:codigo', function (req, res) {

    //estabelece uma conexao com o bd.
    postgres.connect(function(err,client,done) {
       if(err){
           console.log("Não conseguiu acessar o BD :"+ err);
           res.status(400).send('{'+err+'}');
       }else{

        var q1 = {text: 'delete from tb_patente where codigo = $1 returning codigo',
                  values: [req.params.codigo]
                }

        client.query(q1,function(err,result) {
                done(); // closing the connection;
                if(err){
                    console.log("erro ao executar o deletepatente");
                    console.log(err);
                    res.status(400).send('{'+err+'}');
                }else{
                    res.status(200).send(result.rows[0]);
                }
                
            });
       } 
    });
});

sw.listen(4000, function () {
    console.log('Server is running.. on Port 4000');
});