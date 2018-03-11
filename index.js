const RETENCAO_DIAS = parseInt(process.env.RETENCAO_DIAS);

var AWS = require('aws-sdk');
var ec2 = new AWS.EC2();
var erros = [];

exports.handler = (event, context, callback) => {

    backupVolumes(function(){
        removerVencidos(function(){
            if(erros.length == 0){
                callback(null, 'Fim');
            }else{
                callback(erros);
            }
        });
    });

};


function backupVolumes(callback){
    //pega a lista de volumes para fazer backup
    var describeVolumesPromise = ec2.describeVolumes().promise();
    
    describeVolumesPromise.then( function (data) {

        if (data.Volumes.length > 0) {
            var snapshotsFeitos = [];
            
            data.Volumes.forEach(function (elem) {

                //pega o nome do volume
                var tagName = elem.Tags.reduce(function (prev, elem) {
                    if (elem.Key == 'Name') {
                        return elem.Value;
                    } else {
                        return prev;
                    }
                }, '');


                //prepara as tags do snapshot, coloca o mesmo nome do volume e a marcação para remover após o período de retenção
                var TagsSnapshot = [
                    { Key: 'Name', Value: tagName },
                    { Key: 'Remover', Value: 'Sim' }
                ];

                var params = {
                    VolumeId: elem.VolumeId,
                    Description: 'Bakcup automatico',
                    DryRun: false
                };

                //faz o backup
                snapshotsFeitos.push( 
                    ec2.createSnapshot(params).promise().then(function(data) {
                        var params = {
                            Resources: [data.SnapshotId],
                            Tags: TagsSnapshot
                        };

                        //coloca as tags
                        return ec2.createTags(params).promise();
                    })
                );
                
                Promise.all(snapshotsFeitos).then(values => {
                    callback();
                }, reason => {
                    erros.push(reason);
                    callback();
                });
    
            });
            
        }else{
            callback();
        }
    },
    function (err){
        erros.push(err);
        callback();
    });
}


function removerVencidos(callback){
 
    //query para petar os snapshots que foram criados por esse script
    var params = {
        Filters: [
            { Name: "tag:Remover", Values: ["Sim"]}
        ]
    };
    //pega todos os snapshots para verificar a validade deles    
    var describeSnapshotsPromise = ec2.describeSnapshots(params).promise();

    describeSnapshotsPromise.then(
        function(data) {
            var snapshotsExcluidos = [];

            //filtra os snapshots deixandos somente os vencidos
            var arrSnapshotsExcluir = data.Snapshots.filter(function(elem){
                return ( Math.round(Math.abs(Date.now() - Date.parse(elem.StartTime)) / (1000 * 60 * 60 * 24)) > RETENCAO_DIAS );
            });
            
            //remove os vencidos
            arrSnapshotsExcluir.forEach(function(elem){
                var params = {
                    SnapshotId: elem.SnapshotId
                };
                 
                snapshotsExcluidos.push( 
                    ec2.deleteSnapshot(params).promise()
                );
            });
            
            Promise.all(snapshotsExcluidos).then(values => {
                callback();
            }, reason => {
                erros.push(reason);
                callback();
            });
            
        },
        function(err){
            erros.push(err);
            callback();
        }
    );
    
}