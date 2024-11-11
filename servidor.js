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

sw.post('/insertjogador', function(req, res, next){

    postgres.connect(function(err,client,done) {
        if(err){
            console.log("Nao conseguiu acessar o  BD "+ err);
            res.status(400).send('{'+err+'}');
        }else{
            //insert tb_jogador - questão 1 - segunda prova prática - primeira etapa.
            var q1 = {
                text: 'insert into tb_jogador (nickname, senha, quantpontos, quantdinheiro, situacao) values ($1, $2, $3, $4, $5) returning nickname, quantpontos, quantdinheiro, to_char(datacadastro, \'dd/mm/yyyy\') as datacadastro, situacao, 0 as endereco, 0 as patentes',
                values : [req.body.nickname, req.body.senha, req.body.quantpontos, req.body.quantdinheiro, req.body.situacao]
            }            
            // insert em tb_endereco
            client.query(q1, function(err,result1) {
                if(err){
                    console.log('retornou 400 no insert q1 em tb_jogador');
                    res.status(400).send('{'+err+'}');
                }else{
                    var q2 = {
                        text: 'insert into tb_endereco (complemento, cep, nicknamejogador) values ($1, $2, $3) returning cep, complemento',
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
                            // questão 1 - segunda prova prática - primeira etapa.
                            res.status(200).send({"nickname" : result1.rows[0].nickname,
                                                  "quantpontos" : result1.rows[0].quantpontos,
                                                  "quantdinheiro" : result1.rows[0].quantdinheiro,
                                                  "datacadastro" : result1.rows[0].datacadastro,
                                                  "situacao" : result1.rows[0].situacao,
                                                  "endereco" : {"cep" : result2.rows[0].cep, "complemento" : result2.rows[0].complemento}, 
                                                  "patentes" : req.body.patentes})

                        }
                    })
                
                }
            })
        }
       
    });
});

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

sw.post('/insertmapa', function(req, res, next){

    postgres.connect(function(err,client,done) {
        if(err){
            console.log("Nao conseguiu acessar o  BD "+ err);
            res.status(400).send('{'+err+'}');
        }else{
                console.log(req.body.status)
                var q1 = {
                    text: 'insert into tb_mapa (nome, datacadastromapa, status, codmodo) '
                        + ' values ($1, now(), $2, $3) returning codigo, nome, to_char(datacadastromapa, \'dd/mm/yyyy hh24:mi:ss\') as datacadastromapa, status, 0 as locais',
                values : [req.body.nome, req.body.status, req.body.modo.codigo]
            }
            client.query(q1, async function(err,result1) {
                if(err){
                    console.log('retornou 400 no insert q1 para insertmapa');
                    res.status(400).send('{'+err+'}');
                }else{
                    result1.rows[0].locais = []
                    for(var i=0; i < req.body.locais.length; i++){                                              
                        try { //Exercicio 2: incluir todas as colunas de tb_patente.                         
                              pj = await client.query('insert into tb_mapa_locais (codmapa, codlocal) values ($1, $2) returning codmapa, codlocal',
                                [result1.rows[0].codigo, req.body.locais[i].codigo]
                              )

                              result1.rows[0].locais.push(pj.rows)

                        }catch (error){
                            console.log('retornou 400 no insert for em tb_mapa_locais');
                            console.log(error)
                            res.status(400).send('{'+error+'}');
                        }
                    }


                    console.log('retornou 201 no insertmapa');

                    res.status(201).send({"codigo": result1.rows[0].codigo,
                                          "nome"  : result1.rows[0].nome,
                                          "datacadastromapa" : result1.rows[0].datacadastromapa,
                                          "status" : result1.rows[0].status,
                                          "locais" : result1.rows[0].locais
                    });
                }
            });

        }
    });
});

sw.post('/updatemapa', function(req, res, next){

    postgres.connect(function(err,client,done) {
        if(err){
            console.log("Nao conseguiu acessar o  BD "+ err);
            res.status(400).send('{'+err+'}');
        }else{
                console.log(req.body.status)
                var q1 = {
                    text: 'update tb_mapa set nome = $1, status = $2, codmodo = $3 where codigo = $4 returning codigo, nome, codmodo as modo, (select nome from tb_modo where codigo = tb_mapa.codmodo) as modo_nome, to_char(datacadastromapa, \'dd/mm/yyyy hh24:mi:ss\') as datacadastromapa, status, 0 as locais ',                       
                    values : [req.body.nome, (req.body.status == true ? "A" : "I" ), req.body.modo.codigo, req.body.codigo]
                }
            client.query(q1, async function(err,result1) {
                if(err){
                    console.log('retornou 400 no update q1 para updatemapa');
                    res.status(400).send('{'+err+'}');
                }else{

                    var q2 = {
                        text: 'delete from tb_mapa_locais where codmapa = $1;',                       
                        values : [req.body.codigo]
                    }
                    client.query(q2, async function(err,result2) {
                        if(err){
                            console.log('retornou 400 no update q2 para updatemapa');
                            res.status(400).send('{'+err+'}');
                        }else{

                            locais = []
                            for(var i=0; i < req.body.locais.length; i++){                                              
                                try { //Exercicio 2: incluir todas as colunas de tb_patente. , (select nome from tb_local where codigo = tb_mapa_locais.codlocal) as nome, (select statuslocal from tb_local where codigo = tb_mapa_locais.codlocal) as statuslocal                         
                                      pj = await client.query('insert into tb_mapa_locais (codmapa, codlocal) values ($1, $2) returning codlocal as codigo',
                                        [result1.rows[0].codigo, req.body.locais[i].codigo]
                                      )
        
                                      locais.push(pj.rows[0])
        
                                }catch (error){
                                    console.log('retornou 400 no insert for em tb_mapa_locais');
                                    console.log(error)
                                    res.status(400).send('{'+error+'}');
                                }
                            }

                            console.log('retornou 201 no updatemapa');

                            res.status(201).send({"codigo": result1.rows[0].codigo,
                                                  "nome"  : result1.rows[0].nome,
                                                  "datacadastromapa" : result1.rows[0].datacadastromapa,
                                                  "status" : result1.rows[0].status,
                                                  "locais" : locais,
                                                  "modo" : {"codigo": result1.rows[0].modo, "nome" : result1.rows[0].modo_nome}
                            });
                        
                        }
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

sw.get('/deletemapa/:codigo', (req, res) => {

    postgres.connect(function(err,client,done) {
        if(err){
            console.log("Não conseguiu acessar o banco de dados!"+ err);
            res.status(400).send('{'+err+'}');
        }else{

            var q0 ={
                text: 'delete FROM tb_mapa_locais where codmapa = $1',
                values: [req.params.codigo]
            }
            
            var q1 ={
                text: 'delete FROM tb_mapa where codigo = $1',
                values: [req.params.codigo]
            }
          
            client.query( q0 , function(err,result) {

                if(err){
                    console.log(err);
                    res.status(400).send('{'+err+'}');
                }else{

                    client.query( q1 , function(err,result) {
                
                        if(err){
                            console.log(err);
                            res.status(400).send('{'+err+'}');
                        }else{

                            res.status(200).send({'codigo': req.params.codigo});//retorna o nickname deletado.
                            
                        }
                    });

                }

            });

        } 
        done();
     });
});

sw.get('/listmapas', function (req, res, next) { 

    postgres.connect(function(err,client,done) {
       if(err){
           console.log("Nao conseguiu acessar o  BD "+ err);
           res.status(400).send('{'+err+'}');
       }else{            
            var q ='select m.codigo, m.nome, to_char(m.datacadastromapa, \'dd/mm/yyyy\') as datacadastromapa, m.status, m.codmodo as modo, 0 as locais from tb_mapa m order by m.codigo asc';    
            
            client.query(q,async function(err,result) {
                
                if(err){
                    console.log('retornou 400 no listjogadores');
                    console.log(err);                    
                    res.status(400).send('{'+err+'}');
                }else{
                    for(var i=0; i < result.rows.length; i++){                                              
                        try { //Exercicio 2: incluir todas as colunas de tb_patente.                         
                              lc = await client.query('select codlocal as codigo from '+
                                                      'tb_mapa_locais '+
                                                      'where codmapa = $1', 
                                                             [result.rows[i].codigo])                                                    
                              result.rows[i].locais = lc.rows;

                              pe = await client.query('select md.codigo, md.nome from tb_mapa m, '+
                                'tb_modo md '+
                                'where  m.codmodo=md.codigo and md.codigo = $1', 
                                       [result.rows[i].modo])
                              
                              result.rows[i].modo = pe.rows[0];

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

sw.get('/listmodos', function (req, res, next) {
    
    postgres.connect(function(err,client,done) {

       if(err){
           console.log("Nao conseguiu acessar o  BD "+ err);
           res.status(400).send('{'+err+'}');
       }else{            

            var q ='select codigo, nome, datacriacao, quantboots, quantrounds  from tb_modo order by codigo asc;';            
    
            client.query(q,function(err,result) {
                done(); // closing the connection;
                if(err){
                    console.log('retornou 400 no listmodos');
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

sw.get('/listlocais', function (req, res, next) {
    
    postgres.connect(function(err,client,done) {

       if(err){
           console.log("Nao conseguiu acessar o  BD "+ err);
           res.status(400).send('{'+err+'}');
       }else{            

            var q ='select codigo, nome, statuslocal  from tb_local order by codigo asc;';            
    
            client.query(q,function(err,result) {
                done(); // closing the connection;
                if(err){
                    console.log('retornou 400 no listlocais');
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


sw.get('/listtimedisputa', function (req, res, next) {
    
    postgres.connect(function(err,client,done) {

       if(err){
           console.log("Nao conseguiu acessar o  BD "+ err);
           res.status(400).send('{'+err+'}');
       }else{            

            var q1 ='select codigo, nometime, situacao, nicknamejogador as jogador from tb_timedisputa order by codigo asc;';            
    
            client.query(q1, async function(err,result) {
                done(); // closing the connection;
                if(err){
                    console.log('retornou 400 no listmodos');
                    console.log(err);
                    
                    res.status(400).send('{'+err+'}');
                }else{


                    for(var i=0; i < result.rows.length; i++){                                              
                        try { //Exercicio 2: incluir todas as colunas de tb_patente.                         
                              jd = await client.query('select nickname from tb_jogador where nickname = $1;', 
                                                             [result.rows[i].jogador])                                                    
                              result.rows[0].jogador = {"nickname" : jd.rows[0].nickname}       

                        } catch (err) {                                                       
                            res.status(400).send('{'+err+'}');
                        }                                           
                    }

                    //console.log('retornou 201 no /listendereco');
                    res.status(201).send(result.rows);
                }           
            });
       }       
    });
});

sw.post('/inserttimedisputa', function (req, res, next) {
    
    postgres.connect(function(err,client,done) {

       if(err){
           console.log("Nao conseguiu acessar o  BD "+ err);
           res.status(400).send('{'+err+'}');
       }else{            

            var q1 = { text: 'insert into tb_timedisputa (nometime, situacao, nicknamejogador) values ($1, $2, $3) returning codigo, nometime, situacao, 0 as jogador', values : [req.body.nometime, req.body.situacao, req.body.jogador.nickname]}            
    
            client.query(q1, async function(err,result) {
                done(); // closing the connection;
                if(err){
                    console.log('retornou 400 no listmodos');
                    console.log(err);
                    
                    res.status(400).send('{'+err+'}');
                }else{

                    //console.log('retornou 201 no /listendereco');
                    res.status(201).send({"codigo": result.rows[0].codigo,
                                          "nometime" : result.rows[0].nometime,
                                          "situacao" : result.rows[0].situacao,
                                          "jogador" : {"nickname" : req.body.jogador.nickname}
                    });
                }           
            });
       }       
    });
});

sw.get('/listtipomunicao', function (req, res, next) {
    
    postgres.connect(function(err,client,done) {

       if(err){
           console.log("Nao conseguiu acessar o  BD "+ err);
           res.status(400).send('{'+err+'}');
       }else{            

            var q1 ='select codigo, nome, datacriacao from tb_tipomunicao order by codigo asc;';            
    
            client.query(q1, async function(err,result) {
                done(); // closing the connection;
                if(err){
                    console.log('retornou 400 no listtipomunicao');
                    console.log(err);
                    
                    res.status(400).send('{'+err+'}');
                }else{

                    //console.log('retornou 201 no /listtipomunicao');
                    res.status(201).send(result.rows);
                }           
            });
       }       
    });
});

sw.post('/inserttipomunicao', function (req, res, next) {
    
    postgres.connect(function(err,client,done) {

       if(err){
           console.log("Nao conseguiu acessar o  BD "+ err);
           res.status(400).send('{'+err+'}');
       }else{            

            var q1 = { text: 'insert into tb_tipomunicao (nome, datacriacao) values ( $1, now()) returning codigo, nome, datacriacao', 
                        values : [req.body.nome]}            
    
            client.query(q1, async function(err,result) {
                done(); // closing the connection;
                if(err){
                    console.log('retornou 400 no listmodos');
                    console.log(err);
                    
                    res.status(400).send('{'+err+'}');
                }else{

                    //console.log('retornou 201 no /listendereco');
                    res.status(201).send({"codigo": result.rows[0].codigo,
                                          "nome" : result.rows[0].nome,
                                          "datacricao" : result.rows[0].datacriacao                                          
                    });
                }           
            });
       }       
    });
});

sw.listen(4000, function () {
    console.log('Server is running.. on Port 4000');
});