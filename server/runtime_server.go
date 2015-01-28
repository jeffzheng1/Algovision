package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

var BASEQUERY = "http://api.wolframalpha.com/v2/query?appid=997AJT-G8R5JY9LYV&input=g(n)%3D1"
var CONTENTTYPES = "&format=image"

func handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	resp, err := http.Get(BASEQUERY + r.RequestURI[9:] + CONTENTTYPES)
	if err != nil {
	}
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
	}
	fmt.Fprintf(w, "%s", body)
}

func main() {
	http.HandleFunc("/wolfram/", handler)
	http.ListenAndServe(":9090", nil)
}
