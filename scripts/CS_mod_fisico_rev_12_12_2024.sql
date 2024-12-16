-- Geração de Modelo físico
-- Sql ANSI 2003 - brModelo.

-----------------------------------------------------------------------------------------------------
-- 1 TABELA MODO
CREATE TABLE IF NOT EXISTS tb_MODO (
        CODIGO                  SERIAL                  PRIMARY KEY             NOT NULL,
        NOME                    VARCHAR(50)                                     NOT NULL,
        DATACRIACAO             TIMESTAMP                                       NOT NULL,
        QUANTBOOTS              INTEGER                                         NOT NULL,
        QUANTROUNDS             INTEGER                                         NOT NULL
);

-----------------------------------------------------------------------------------------------------
-- 2 TABELA MAPA
CREATE TABLE IF NOT EXISTS tb_MAPA (
        CODIGO                  SERIAL                  PRIMARY KEY             NOT NULL,
        CODMODO                 INTEGER                                         NOT NULL,  
        NOME                    VARCHAR(30)                                     NOT NULL,
        DATACADASTROMAPA        TIMESTAMP                                       NOT NULL,
        STATUS                  CHAR(1)                                            NOT NULL        CHECK(STATUS = 'A' OR STATUS = 'I'),
    FOREIGN KEY(CODMODO)        REFERENCES tb_MODO (CODIGO)
);

-----------------------------------------------------------------------------------------------------
-- 3 TABELA LOCAL
CREATE TABLE IF NOT EXISTS tb_LOCAL (
        CODIGO                  SERIAL                  PRIMARY KEY             NOT NULL,
        NOME                    VARCHAR(30)                                     NOT NULL,
        STATUSLOCAL             BOOLEAN                                         NOT NULL                
);

-----------------------------------------------------------------------------------------------------
-- 4 TABELA MAPA POSSUI LOCAIS
CREATE TABLE IF NOT EXISTS tb_MAPA_LOCAIS (
        CODMAPA                 SERIAL                                          NOT NULL,
        CODLOCAL                SERIAL                                          NOT NULL,
    FOREIGN KEY(CODMAPA)        REFERENCES tb_MAPA (CODIGO),
    FOREIGN KEY(CODLOCAL)       REFERENCES tb_LOCAL (CODIGO)
);

alter table tb_mapa_locais add constraint pk_m_l_tb_mapa_locais primary key (codmapa, codlocal);
-----------------------------------------------------------------------------------------------------
--5 TABELA PATENTE

CREATE TABLE IF NOT EXISTS tb_PATENTE (
        CODIGO                  SERIAL                  PRIMARY KEY             NOT NULL,
        NOME                    VARCHAR(100)                                    NOT NULL,
        QUANT_MIN_PONTOS        INTEGER                                         NOT NULL,
        DATACRIACAO             TIMESTAMP                                       NOT NULL,
        COR                     VARCHAR(50)                                     NOT NULL,
        LOGOTIPO                TEXT					       NULL	
);

-----------------------------------------------------------------------------------------------------
--6  TABELA JOGADOR
CREATE TABLE IF NOT EXISTS tb_JOGADOR (
        NICKNAME                VARCHAR(10)             PRIMARY KEY             NOT NULL,
        SENHA                   VARCHAR(10)                                     NOT NULL,
        QUANTPONTOS             INTEGER                                         NOT NULL,
        QUANTDINHEIRO           NUMERIC(7,2)                                    NOT NULL,
        DATACADASTRO            TIMESTAMP                                       NOT NULL        DEFAULT now(),
        DATA_ULTIMO_LOGIN       TIMESTAMP                                               ,
        SITUACAO                CHAR(1)                                            NOT NULL        CHECK(SITUACAO = 'A' OR SITUACAO = 'I')
);

-----------------------------------------------------------------------------------------------------
--7 TABELA JOGADOR CONQUISTA UMA PATENTE
CREATE TABLE IF NOT EXISTS tb_JOGADOR_CONQUISTA_PATENTE (
        CODPATENTE              SERIAL                                          NOT NULL,
        NICKNAME                VARCHAR(10)                                     NOT NULL,
    FOREIGN KEY(CODPATENTE)     REFERENCES tb_PATENTE (CODIGO),
    FOREIGN KEY(NICKNAME)       REFERENCES tb_JOGADOR (NICKNAME)
);

alter table tb_JOGADOR_CONQUISTA_PATENTE add constraint pk_p_n_tb_JOGADOR_CONQUISTA_PATENTE primary key (CODPATENTE, NICKNAME);

-----------------------------------------------------------------------------------------------------
--8 TABELA ENDEREÇO DO JOGADOR
CREATE TABLE IF NOT EXISTS tb_ENDERECO (
        CODIGO                  SERIAL                  PRIMARY KEY             NOT NULL,
        COMPLEMENTO             VARCHAR(100)                                    NULL,
        CEP                     VARCHAR(8)                                      NULL,
        NICKNAMEJOGADOR         VARCHAR(10)                                     NOT NULL,
    FOREIGN KEY(NICKNAMEJOGADOR)       REFERENCES tb_JOGADOR (NICKNAME)
);

-----------------------------------------------------------------------------------------------------
--9 TABELA TIPO MUNICAO
CREATE TABLE IF NOT EXISTS tb_TIPOMUNICAO (
        CODIGO                  SERIAL                  PRIMARY KEY             NOT NULL,
        NOME                    VARCHAR(100)                                    NOT NULL,
        DATACRIACAO             TIMESTAMP                                       NOT NULL
);

-----------------------------------------------------------------------------------------------------
--10 TABELA ARTEFATO
CREATE TABLE IF NOT EXISTS tb_ARTEFATO (
        CODIGO                  SERIAL                  PRIMARY KEY             NOT NULL,
        TIPO                    CHAR(1)                                         NOT NULL  CHECK(TIPO = 'A' OR TIPO = 'M'),
        NOME                    VARCHAR(100)                                    NOT NULL,
        VALOR                   NUMERIC(7,2)                                    NOT NULL,
        DATACRIACAO             TIMESTAMP                                       NOT NULL DEFAULT now()
);

-----------------------------------------------------------------------------------------------------
--11 TABELA ARMA
CREATE TABLE IF NOT EXISTS tb_ARMA (
        CODARTEFATO             INTEGER                PRIMARY KEY                          NOT NULL,
        NIVEL_DANO              INTEGER                                         NOT NULL                CHECK(NIVEL_DANO > 0 OR NIVEL_DANO < 100),
        VELOCIDADE_RECARGA      NUMERIC(7,2)                                    NOT NULL,
        QUANT_MAX_COMPRA        INTEGER                                         NOT NULL,
    FOREIGN KEY(CODARTEFATO)    REFERENCES tb_ARTEFATO (CODIGO)
);

-----------------------------------------------------------------------------------------------------
--12 TABELA MUNICAO
CREATE TABLE IF NOT EXISTS tb_MUNICAO (
        CODARTEFATO             SERIAL                  PRIMARY KEY             NOT NULL,
        COD_TIPOMUNICAO         INTEGER                                         NOT NULL,
        QUANT_MAX_COMPRA        INTEGER                                         NOT NULL,
        CALIBRE                 NUMERIC                                         NOT NULL,
    FOREIGN KEY(CODARTEFATO)    REFERENCES tb_ARTEFATO (CODIGO),
    FOREIGN KEY(COD_TIPOMUNICAO) REFERENCES tb_TIPOMUNICAO (CODIGO)
);

-----------------------------------------------------------------------------------------------------
--13 TABELA COMPRA
CREATE TABLE IF NOT EXISTS tb_COMPRA (
        CODIGO                  SERIAL                  PRIMARY KEY             NOT NULL,
        NICKNAME                VARCHAR(10)                                     NOT NULL,
        DATA                    TIMESTAMP                                       NOT NULL,
        OBSERVACAO              VARCHAR(100)                                    NULL,
        VALORTOTAL              NUMERIC(7,2)                                    NULL,
    FOREIGN KEY(NICKNAME)       REFERENCES tb_JOGADOR (NICKNAME)
);
-----------------------------------------------------------------------------------------------------
--14 TABELA COMPRA_ARMA
CREATE TABLE IF NOT EXISTS tb_COMPRA_ARMA (
    	CODARTEFATO             INTEGER                                         NOT NULL,
	CODCOMPRA               INTEGER                                         NOT NULL,
	QUANTIDADE              INTEGER                                         NOT NULL,
	VALOR_ITEM              NUMERIC(7,2)                                    NULL,
    FOREIGN KEY(CODARTEFATO)    REFERENCES tb_ARMA (CODARTEFATO),
    FOREIGN KEY(CODCOMPRA)      REFERENCES tb_COMPRA (CODIGO)
);

alter table tb_COMPRA_ARMA add constraint pk_a_c_tb_COMPRA_ARMA primary key (CODARTEFATO, CODCOMPRA);

--14.1 TABELA COMPRA_MUNICAO

CREATE TABLE IF NOT EXISTS tb_COMPRA_MUNICAO (
    	CODARTEFATO             INTEGER                                         NOT NULL,
	CODCOMPRA               INTEGER                                         NOT NULL,
	QUANTIDADE              INTEGER                                         NOT NULL,
	VALOR_ITEM              NUMERIC(7,2)                                    NULL,
    FOREIGN KEY(CODARTEFATO)    REFERENCES tb_MUNICAO (CODARTEFATO),
    FOREIGN KEY(CODCOMPRA)      REFERENCES tb_COMPRA (CODIGO)
);

alter table tb_COMPRA_MUNICAO add constraint pk_a_c_tb_COMPRA_MUNICAO primary key (CODARTEFATO, CODCOMPRA);



-----------------------------------------------------------------------------------------------------
--15 TABELA JOGADOR_ARTEFATO
CREATE TABLE IF NOT EXISTS tb_JOGADOR_ARTEFATO (
        CODARTEFATO             INTEGER                                         NOT NULL,
        NICKNAMEJOGADOR         VARCHAR(10)                                     NOT NULL,        
        QUANTIDADE              INTEGER                                         NOT NULL,
    FOREIGN KEY(CODARTEFATO)    REFERENCES tb_ARTEFATO (CODIGO),
    FOREIGN KEY(NICKNAMEJOGADOR)       REFERENCES tb_JOGADOR (NICKNAME)
);

alter table tb_JOGADOR_ARTEFATO add constraint pk_a_n_tb_JOGADOR_ARTEFATO primary key (CODARTEFATO, NICKNAMEJOGADOR);

-----------------------------------------------------------------------------------------------------
--16 TABELA TIMEDISPUTA
CREATE TABLE IF NOT EXISTS tb_TIMEDISPUTA (
        CODIGO                  SERIAL                  PRIMARY KEY             NOT NULL,
        NOMETIME                VARCHAR(20)                                     NOT NULL,
        NICKNAMEJOGADOR         VARCHAR(10)                                     NOT NULL,
        SITUACAO                BOOLEAN                                         NOT NULL,
    FOREIGN KEY(NICKNAMEJOGADOR)       REFERENCES tb_JOGADOR (NICKNAME)
);

-----------------------------------------------------------------------------------------------------
--17 TABELA PARTIDA
CREATE TABLE IF NOT EXISTS tb_PARTIDA (
        CODIGO                  SERIAL                  PRIMARY KEY             NOT NULL,
        CODMAPA                 integer                                          NOT NULL,
        CODTIMEDISPUTA          integer                                         NOT NULL,
        DATAINICIO              TIMESTAMP                                       NOT NULL,
        DATAFIM                 TIMESTAMP                                       NULL,
        RESULTADO               BOOLEAN                                         NOT NULL,
    FOREIGN KEY(CODMAPA)        REFERENCES tb_MAPA (CODIGO),
    FOREIGN KEY(CODTIMEDISPUTA) REFERENCES tb_TIMEDISPUTA (CODIGO)
);

-----------------------------------------------------------------------------------------------------
--18 TABELA ROUND

CREATE TABLE IF NOT EXISTS tb_ROUND (
        NUMERO                  INTEGER                              NOT NULL,
        CODPARTIDA              INTEGER                              NOT NULL,        
        DATAINICIO              TIMESTAMP                                       NOT NULL,
        DATAFIM                 TIMESTAMP                                       NULL,
        RESULTADO               BOOLEAN                                         NOT NULL,
        QUANTRESGATES           INTEGER                                         NOT NULL,
        QUANTMORTES             INTEGER                                         NOT NULL,
    PRIMARY KEY(NUMERO, CODPARTIDA),
    FOREIGN KEY(CODPARTIDA)     REFERENCES tb_PARTIDA (CODIGO)
);


CREATE TABLE IF NOT EXISTS tb_OPCIONAL (
        ID                      SERIAL                                          NOT NULL,
        DESCRICAO               INTEGER                                         NOT NULL,        
        DATA_CADASTRO           TIMESTAMP                                       NOT NULL DEFAULT now(),
        VALOR                   NUMERIC(7,2)                                    NULL,
        STATUS                  BOOLEAN                                         NOT NULL,
    PRIMARY KEY(ID)
);
