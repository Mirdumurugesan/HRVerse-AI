const Candidate = require("../models/Candidate");

const getTopCandidates = async (
  req,
  res
) => {

  try {

    const candidates =
      await Candidate.find()
      .sort({
        aiScore:-1
      });

    res.status(200).json(
      candidates
    );

  } catch(error){

    res.status(500).json({
      error:error.message
    });

  }

};

module.exports = {
  getTopCandidates
};