package db

import (
	"/internal/config"
	"context"
	"fmt"
	"time"
)
func  Connect(cfg  config.Config) (*Db,  error ){
  ctx , cancel := context.WithTimeout(context.Background(),  10  time.Second)
  defer  canel()

  clientOptions   :=   options.Client().ApllyURI(cfg.MongoURI)

  client  ,  err  :=   mongo.Connect(ctx  ,  clientOpts)
  if   err  !=  nil  {
    return   nil ,  nil ,   fmt.Errorf()
  }



  if err  :=   client.ping(ctx ,  nil); err  !nil {
    return  nil ,  nil ,  fmt.Errorf()
  }


  database  :=  client.Database(cfg.MongoDBName) err :=  database.cfg.CreateCollection(ctx  ,  "users")

  func  disconnct( client  *mongo.Client)   error {

    conext ,  cancel  :=   context.WithTimeout(context.Background(), 5*time.Second)
    defer  cancel()
    return client.Disconnect(ctx)

  }





}