

// main function of the request (eg..get all tours) comes here..we return the same function chained with catch

module.exports = (fn) => {
  // we recieve function
  return (req, res, next) => {
    // the function RECIEVED is an async function with parameters req,res,next

    fn(req, res, next).catch((err) => next(err )); //since fn is an async function it returns a promise so we can chain catch with it
  };
};  

// it is like :
// fn(req,res,next){
//   returns functionx(req,res,next){
//                    fn(req,res,next).catch(next)
// }
//}
