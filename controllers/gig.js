const Gig = require('../models/Gig');
const User = require('../models/User');
const log4js = require('log4js');

const logger = log4js.getLogger('gig');
const gigDataJson = require('./gig-data.json');

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateGig = (req, res, next) => {
  const errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/gigs');
  }

  const gig = new Gig({
    jobId: req.body.jobId,
    description: req.body.description,
    location: req.body.location,

    profession: req.body.profession,
    specialty: req.body.specialty,
    state: req.body.state,
    days: req.body.days,
  });

  Gig.findOne({ jobId: req.body.jobId }, (err, existingGig) => {
    if (err) { return next(err); }
    if (existingGig) {
      req.flash('errors', { msg: 'Gig id already exists.' });
      return res.redirect('/gig/create');
    }
    gig.save((err) => {
      if (err) { return next(err); }
      return res.redirect('/gig/create');
    });
  });
};

/**
 * GET /gig/create
 * Set up views/gigs/gig that then calls postUpdateGig
 */
exports.getCreateGig = (req, res) => {
  res.render('gigs/gig', {
    title: 'Gig'
  });
};

function printGig(gig) {
  const names = ['jobId', 'description', 'location', 'profession', 'specialty', 'state', 'days'];
  const fields = names.map(f => `${f}: ${gig[f]}`);
  return fields.join();
}

/**
 * GET /gig/create
 * Set up views/gigs/gig that then calls postUpdateGig
 */
exports.getListGig = (req, res) => {
  return Gig.find('*', (err, existingGigs) => {
    // if (err) { return next(err); }
    const displayGigs = existingGigs.map(g => printGig(g));
    logger.debug(`gigs: ${JSON.stringify(displayGigs)}`);
    const displayQuals = [];
    if (req.user) {
      displayQuals.push(`Profession: ${req.user.profession}`);
    }
    res.render('gigs/gig_list', {
      title: 'Gig',
      gigs: displayGigs,
      qualifiedUsers: displayQuals,
    });
  });
};

exports.bulkLoad = (req, res) => {
  const displayGigs = Object.keys(gigDataJson).map((u) => {
    const gig = new Gig(gigDataJson[u]);
    gig.save((err) => {
      if (err) { return err; }
    });
    return printGig(gig);
  });
  res.render('gigs/gig_list', {
    title: 'Gigs',
    gigs: displayGigs,
    qualifiedUsers: [],
  });
};

function printUser(user) {
  const names = ['name', 'gender', 'age', 'profession', 'specialties', 'state_licenses', 'days', 'rate'];
  const fields = names.map(f => `${f}: ${user.profile[f]}`);
  return fields.join();
}

function matchUserGig(user, gig) {
  // profession
  // gig:speciality in user:specialties (single now)
  // gig:state in user:state_licenses (comma-sep)
  // gig:days in user:days
  const userSpecialties = user.specialties ? user.specialties.split(',') : [];
  const gigDays = gig.days ? gig.days.split(',') : [];
  const userDays = user.days ? user.days.split(',') : [];
  const userStates = user.state_licenses ? user.state_licenses.split(',') : [];
  if (gig.profession !== user.profession) {
    return false;
  } else if (userSpecialties.indexOf(gig.specialty) < 0) {
    return false;
  } else if (userStates.indexOf(gig.state) < 0) {
    return false;
  // TODO: multi-to-multi-search
  } else if (gigDays.indexOf(userDays[0]) < 0) {
    return false;
  }
  return true;
}

exports.findGigMatches = (req, res) => {
  return Gig.find('*', (err, existingGigs) => {
    if (err) { return err; }

    const displayGigs = existingGigs.map(g => printGig(g));
    logger.debug(`gigs: ${JSON.stringify(displayGigs)}`);

    return User.find({}, (err, existingUsers) => {
      if (err) { return err; }
      const displayUsers = existingUsers.map(u => printUser(u));
      logger.debug(`Users: ${JSON.stringify(displayUsers)}`);
      for (const g of existingGigs) {
        logger.debug(`Git: ${printGig(g)}`);
        for (const u of existingUsers) {
          logger.debug(`   User: ${printUser(u)}`);
          logger.debug(`     Matches: ${matchUserGig(u,g)}`);
        }
      }
      res.render('gigs/gig_list', {
        title: 'Gigs',
        gigs: displayGigs,
        qualifiedUsers: displayUsers,
      });
    });
  });
};
