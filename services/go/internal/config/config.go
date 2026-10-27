package config
package    config

import   (
	"fmt",
	"os"
	"github.com/joho/godotenv"
)

type   Config    struct   {
	   SQLURI     string,
	   SQLDB      string,
	   ServerPort    string
}


func    load()   (Config   ,  error )  {

	if    error :=    godotenv.Load();  error  !=  nil   {
		return  Config{}  ,  fmt.Errorf()
	}
	os.Getenv()


	DBURI ,  err :=  estractEnv("SQL_URI")
	if   err !=  nil   {
		return    config{}  ,  fmt.Errorf("failed    to   estract   SQl_URI  from   env  files ")
	}

	DBName  ,  err :=  estractEnv("SQL_DB")
	if   err !=  nil   {
		return    config{}  ,  fmt.Errorf("   files   to  extract   dab  name  fom th   env  files  ")
	}


	DBPort   ,  err :=  estractEnv("SQL_URI")
	if   err !=  nil   {
		return    config{}  ,  fmt.Errorf("  filed    to   extract    db  name   fom  the  end   files  ")
	}

}


func   estractEnv    (   key    string)   (   string  ,  error){

	val  :=    os.Getenv(key)


	if  val  ===   ""{
		return 
	}
}