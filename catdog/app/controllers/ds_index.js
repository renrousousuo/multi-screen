

module.exports = {};

module.exports.execute = function(req, res){
    __fh.db.collection('ds_resources').find({}).toArray(function(err, result){
        //console.log(result);
        res.render('ds_index.html',{
            'ds_list' : result
        });
    });
};