angular.module('fileUpload', ['ngFileUpload'])
    .controller('MyCtrl', ['Upload', '$window','$http', function (Upload, $window,$http) {
        var vm = this;
        vm.submit = function () { //function to call on form submit
            if (vm.upload_form.file.$valid && vm.file) { //check if from is valid
                vm.upload(vm.file); //call upload function
            }
        }

        vm.upload = function (file) {
            Upload.upload({
                url: 'http://localhost:3000/upload', //webAPI exposed to upload the file
                data: { file: file } //pass file as data, should be user ng-model
            }).then(function (resp) { //upload function returns a promise
                if (resp.data.error_code === 0) { //validate success
                    $window.alert('Success.');
                    isPresentValue = true;
                    // Perform Actions
                    // location.reload();
                } else {
                    $window.alert('Please upload Kubernetes config file in YAML or JSON format');
                }
            }, function (resp) { //catch error
                // console.log('Error status: ' + resp.status);
                // Perform Actions
                $window.alert('Error status: ' + resp.status);
            });
        };
    }]);