package main

import (
	"log"

	"github.com/gohugoio/hugo/config"
)

func main() {

	//load  all  configurations

	cfg, err := config.Load()

	if err  !=  nil  {
     log.Fatalf("Db   Error")
	}

	client  ,  datbase ,  err :=  db.Connect(cfg)
	if  err   !=   nil  {
        log.Printf("Db   disconnected")
	}()




	router  :=  server.NewRouter()


	addr  :=   fmt.Sprintf(":%s"  ,   cfg.ServerPort)

	if   err 



}