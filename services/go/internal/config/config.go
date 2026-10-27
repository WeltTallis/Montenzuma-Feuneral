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

	

}


func   estractEnv    (   key    string)   (   string  ,  error){

	val  :=    os.Getenv(key)


	if  val  ===   ""{
		return 
	}
}