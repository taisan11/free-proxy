function Go() {
  let element = document.getElementById("url");
  console.log(element.value);
  let url = location.href;
  location.href(`${url}/${element.value}`);
}
