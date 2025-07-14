const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler()).catch((err) => next(err));
  };
};

export { asyncHandler };

// send function downline to another function
// const asyncHandler = () => {}
// const asyncHandler = (func) => ()=> {}
// const asyncHandler = (func) => async() => {}

// some code base this kind of wrapper function
// this are also call as higher order function,
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//   } catch (err) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
